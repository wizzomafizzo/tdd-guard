package parser

import (
	"bufio"
	"encoding/json"
	"fmt"
	"io"
	"strings"
)

// TestEvent represents a test event from go test -json
type TestEvent struct {
	Action      string  `json:"Action"`
	Package     string  `json:"Package"`
	Test        string  `json:"Test"`
	Elapsed     float64 `json:"Elapsed"`
	Output      string  `json:"Output"`
	ImportPath  string  `json:"ImportPath"`
	FailedBuild string  `json:"FailedBuild"`
}

// TestState represents the state of a test
type TestState string

const (
	StatePassed  TestState = "passed"
	StateFailed  TestState = "failed"
	StateSkipped TestState = "skipped"
)

// PackageResults holds test results for a package
type PackageResults map[string]TestState

// Results holds all package results
type Results map[string]PackageResults

// Parser parses go test JSON output
type Parser struct {
	results       Results
	errorOutputs  map[string]string
	testOutputs   map[string]map[string]string // Track test output content
	buildFailures map[string]string            // Track build failures and their output
}

// NewParser creates a new parser
func NewParser() *Parser {
	return &Parser{
		results:       make(Results),
		errorOutputs:  make(map[string]string),
		testOutputs:   make(map[string]map[string]string),
		buildFailures: make(map[string]string),
	}
}

// Parse reads from the provided reader
func (p *Parser) Parse(reader io.Reader) error {
	scanner := bufio.NewScanner(reader)

	for scanner.Scan() {
		var event TestEvent
		if err := json.Unmarshal(scanner.Bytes(), &event); err != nil {
			continue // Skip malformed JSON
		}

		p.processEvent(&event)
	}

	return scanner.Err()
}

// processEvent handles a single test event
func (p *Parser) processEvent(event *TestEvent) {
	// Handle build events (they have ImportPath instead of Package)
	if event.ImportPath != "" && event.Action == "build-output" {
		p.buildFailures[event.ImportPath] += event.Output
		return
	}

	// Handle build failure events
	if event.Action == "fail" && event.FailedBuild != "" {
		p.ensurePackageExists(event.Package)
		p.results[event.Package]["CompilationError"] = StateFailed
		return
	}

	// Skip events without package
	if event.Package == "" {
		return
	}

	p.ensurePackageExists(event.Package)

	if event.Test == "" {
		p.processPackageEvent(event)
		return
	}

	p.processTestEvent(event)
}

// ensurePackageExists creates package maps if they don't exist
func (p *Parser) ensurePackageExists(pkg string) {
	if p.results[pkg] == nil {
		p.results[pkg] = make(PackageResults)
	}
}

// processPackageEvent handles package-level events (no test name)
func (p *Parser) processPackageEvent(event *TestEvent) {
	if event.Action == "output" {
		p.errorOutputs[event.Package] += event.Output
	}
	// Handle package-level fail (build failure without FailedBuild flag)
	if event.Action == "fail" {
		// Package failed but has no tests - this is a build failure
		if len(p.results[event.Package]) == 0 {
			p.results[event.Package]["CompilationError"] = StateFailed
		}
	}
}

// processTestEvent handles test-specific events
func (p *Parser) processTestEvent(event *TestEvent) {
	switch event.Action {
	case "output":
		p.captureTestOutput(event)
	case "pass", "fail", "skip":
		p.recordTestState(event)
	}
}

// captureTestOutput captures output for a specific test
func (p *Parser) captureTestOutput(event *TestEvent) {
	if p.testOutputs[event.Package] == nil {
		p.testOutputs[event.Package] = make(map[string]string)
	}

	// Skip RUN and FAIL lines
	if strings.HasPrefix(event.Output, "=== RUN") || strings.HasPrefix(event.Output, "--- FAIL") {
		return
	}

	// Trim leading whitespace and append to existing output
	p.testOutputs[event.Package][event.Test] += strings.TrimLeft(event.Output, " \t")
}

// recordTestState records the final state of a test
func (p *Parser) recordTestState(event *TestEvent) {
	var state TestState
	switch event.Action {
	case "pass":
		state = StatePassed
		p.ensureTestOutputExists(event.Package, event.Test)
	case "fail":
		state = StateFailed
	case "skip":
		state = StateSkipped
	}

	p.results[event.Package][event.Test] = state
}

// ensureTestOutputExists ensures test output map exists for passed tests
func (p *Parser) ensureTestOutputExists(pkg, test string) {
	if p.testOutputs[pkg] == nil {
		p.testOutputs[pkg] = make(map[string]string)
	}
	if _, exists := p.testOutputs[pkg][test]; !exists {
		p.testOutputs[pkg][test] = ""
	}
}

// GetResults returns the parsed results with parent tests filtered out
func (p *Parser) GetResults() Results {
	filtered := make(Results)

	for pkg, tests := range p.results {
		filtered[pkg] = filterParentTests(tests)
	}

	return filtered
}

// filterParentTests removes tests that have subtests from the results
func filterParentTests(tests PackageResults) PackageResults {
	filtered := make(PackageResults)

	for testName, testState := range tests {
		if !hasSubtests(testName, tests) {
			filtered[testName] = testState
		}
	}

	return filtered
}

// hasSubtests checks if a test has any subtests
func hasSubtests(testName string, allTests PackageResults) bool {
	for otherTest := range allTests {
		if isSubtestOf(otherTest, testName) {
			return true
		}
	}
	return false
}

// isSubtestOf checks if child is a subtest of parent
func isSubtestOf(child, parent string) bool {
	return len(child) > len(parent) &&
		child[:len(parent)] == parent &&
		child[len(parent)] == '/'
}

// GetErrorOutput returns captured error output for a package
func (p *Parser) GetErrorOutput(pkg string) string {
	return p.errorOutputs[pkg]
}

// GetTestOutput returns captured output for a specific test
func (p *Parser) GetTestOutput(pkg, test string) string {
	// Special case for CompilationError - get build failure message
	if test == "CompilationError" {
		// Find the build failure for this package
		for _, msg := range p.buildFailures {
			// The build failure message contains the error details
			if msg != "" {
				trimmed := strings.TrimSpace(msg)
				return truncateTestOutput(trimmed)
			}
		}
	}

	if p.testOutputs[pkg] == nil {
		return ""
	}
	output, exists := p.testOutputs[pkg][test]
	if !exists {
		return ""
	}
	// Trim trailing whitespace/newlines and truncate if necessary
	trimmed := strings.TrimRight(output, "\n")
	return truncateTestOutput(trimmed)
}

// GetBuildFailure returns captured build failure output for a package
func (p *Parser) GetBuildFailure(importPath string) string {
	return p.buildFailures[importPath]
}

func truncateTestOutput(output string) string {
	// Handle race conditions specially - preserve file location for AI parsing
	if strings.Contains(output, "race detected during execution of test") {
		raceCount := strings.Count(output, "race detected during execution of test")
		
		// For multiple races, use summary format
		if raceCount > 1 {
			return fmt.Sprintf("Multiple race conditions detected - race detected during execution of test (%d races found)", raceCount)
		}
		
		// For single race, try to preserve file location
		lines := strings.Split(output, "\n")
		// Try to find first .go:line line mentioning race for AI parsing
		for _, line := range lines {
			if strings.Contains(line, "race detected during execution of test") && strings.Contains(line, ".go:") {
				// Return the full line with file location preserved
				return strings.TrimSpace(line)
			}
		}
		// Fallback: look for any .go:line then add race context
		for _, line := range lines {
			if strings.Contains(line, ".go:") && strings.Contains(line, ":") {
				trimmed := strings.TrimSpace(line)
				if !strings.Contains(trimmed, "race detected") {
					return trimmed + " [race detected]"
				}
				return trimmed
			}
		}
		// Last resort - generic message
		return "race detected during execution of test"
	}
	
	// For short output, return unchanged
	const maxLength = 500
	if len(output) <= maxLength {
		return output
	}
	
	// For long output, truncate and indicate
	lines := strings.Split(output, "\n")
	if len(lines) <= 5 {
		// Truncate by character count
		return output[:maxLength-50] + fmt.Sprintf(" [truncated %d chars]", len(output)-maxLength+50)
	}
	
	// Take first 5 lines but prioritize lines with file location info for AI parsing
	selectedLines := selectLinesForTruncation(lines, 5)
	remainingLines := len(lines) - len(selectedLines)
	return fmt.Sprintf("%s\n[truncated %d more lines]", strings.Join(selectedLines, "\n"), remainingLines)
}

// selectLinesForTruncation selects lines for truncation, prioritizing file location info for AI parsing
func selectLinesForTruncation(lines []string, maxLines int) []string {
	if len(lines) <= maxLines {
		return lines
	}
	
	// Find lines with file location info (file.go:line patterns)
	fileLocationLines := make([]int, 0)
	for i, line := range lines {
		if containsGoFileLocation(line) {
			fileLocationLines = append(fileLocationLines, i)
		}
	}
	
	selected := make([]string, 0, maxLines)
	used := make(map[int]bool)
	
	// First, include file location lines (up to maxLines)
	for _, lineIdx := range fileLocationLines {
		if len(selected) >= maxLines {
			break
		}
		selected = append(selected, lines[lineIdx])
		used[lineIdx] = true
	}
	
	// Then fill remaining slots with lines from the beginning
	for i := 0; i < len(lines) && len(selected) < maxLines; i++ {
		if !used[i] {
			selected = append(selected, lines[i])
			used[i] = true
		}
	}
	
	return selected
}

// containsGoFileLocation checks if a line contains Go file location info (file.go:line:col or file.go:line)
func containsGoFileLocation(line string) bool {
	return strings.Contains(line, ".go:") && (strings.Count(line, ":") >= 2)
}

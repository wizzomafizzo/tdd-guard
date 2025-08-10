package parser

import (
	"bufio"
	"encoding/json"
	"io"
	"strings"
)

// TestEvent represents a test event from go test -json
type TestEvent struct {
	Action  string  `json:"Action"`
	Package string  `json:"Package"`
	Test    string  `json:"Test"`
	Elapsed float64 `json:"Elapsed"`
	Output  string  `json:"Output"`
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
	results      Results
	errorOutputs map[string]string
	testOutputs  map[string]map[string]string // Track test output content
}

// NewParser creates a new parser
func NewParser() *Parser {
	return &Parser{
		results:      make(Results),
		errorOutputs: make(map[string]string),
		testOutputs:  make(map[string]map[string]string),
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
	// Skip events without package
	if event.Package == "" {
		return
	}

	// Get or create package results
	if p.results[event.Package] == nil {
		p.results[event.Package] = make(PackageResults)
	}

	// Capture package-level output (for compilation errors)
	if event.Test == "" && event.Action == "output" {
		p.errorOutputs[event.Package] += event.Output
	}

	// Skip events without test name
	if event.Test == "" {
		return
	}

	// Track output events
	if event.Action == "output" {
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

	// Record test state for terminal actions
	switch event.Action {
	case "pass":
		p.results[event.Package][event.Test] = StatePassed
		// Track that this test exists (but has no output if not already tracked)
		if p.testOutputs[event.Package] == nil {
			p.testOutputs[event.Package] = make(map[string]string)
		}
		if _, exists := p.testOutputs[event.Package][event.Test]; !exists {
			p.testOutputs[event.Package][event.Test] = ""
		}
	case "fail":
		p.results[event.Package][event.Test] = StateFailed
	case "skip":
		p.results[event.Package][event.Test] = StateSkipped
	}
}

// GetResults returns the parsed results with parent tests filtered out
func (p *Parser) GetResults() Results {
	filtered := make(Results)

	for pkg, tests := range p.results {
		filteredTests := make(PackageResults)

		for testName, testState := range tests {
			// Check if this test has any children
			hasChildren := false
			for otherTest := range tests {
				if len(otherTest) > len(testName) &&
					otherTest[:len(testName)] == testName &&
					otherTest[len(testName)] == '/' {
					hasChildren = true
					break
				}
			}

			// Only include tests without children
			if !hasChildren {
				filteredTests[testName] = testState
			}
		}

		filtered[pkg] = filteredTests
	}

	return filtered
}

// GetErrorOutput returns captured error output for a package
func (p *Parser) GetErrorOutput(pkg string) string {
	return p.errorOutputs[pkg]
}

// GetTestOutput returns captured output for a specific test
func (p *Parser) GetTestOutput(pkg, test string) string {
	if p.testOutputs[pkg] == nil {
		return ""
	}
	output, exists := p.testOutputs[pkg][test]
	if !exists {
		return ""
	}
	// Trim trailing whitespace/newlines
	return strings.TrimRight(output, "\n")
}

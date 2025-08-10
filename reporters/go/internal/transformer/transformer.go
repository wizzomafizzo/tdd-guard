package transformer

import (
	"github.com/nizos/tdd-guard/reporters/go/internal/parser"
)

// TestError represents an error from a test
type TestError struct {
	Message string `json:"message"`
}

// Test represents a single test
type Test struct {
	Name     string      `json:"name"`
	FullName string      `json:"fullName"`
	State    string      `json:"state"`
	Errors   []TestError `json:"errors,omitempty"`
}

// TestModule represents a module with its tests
type TestModule struct {
	ModuleID string `json:"moduleId"`
	Tests    []Test `json:"tests"`
}

// TestResult represents the TDD Guard test result format
type TestResult struct {
	TestModules []TestModule `json:"testModules"`
	Reason      string       `json:"reason,omitempty"`
}

// Transformer transforms parser results to TDD Guard format
type Transformer struct{}

// NewTransformer creates a new transformer
func NewTransformer() *Transformer {
	return &Transformer{}
}

// Transform converts parser results to TDD Guard format
func (t *Transformer) Transform(results parser.Results, p *parser.Parser, compilationError *parser.CompilationError) *TestResult {
	modules := []TestModule{}
	reason := "passed"

	for pkg, tests := range results {
		module := TestModule{
			ModuleID: pkg,
			Tests:    transformTests(pkg, tests, p, compilationError),
		}
		modules = append(modules, module)

		// Update reason if any test failed
		for _, state := range tests {
			if state == parser.StateFailed {
				reason = "failed"
			}
		}
	}

	return &TestResult{
		TestModules: modules,
		Reason:      reason,
	}
}

// transformTests converts package test results to Test structs
func transformTests(pkg string, tests parser.PackageResults, p *parser.Parser, compilationError *parser.CompilationError) []Test {
	result := make([]Test, 0, len(tests))

	for name, state := range tests {
		test := Test{
			Name:     name,
			FullName: pkg + "/" + name,
			State:    string(state),
		}

		// Add error message for failed tests
		if state == parser.StateFailed {
			if msg := getTestErrorMessage(pkg, name, p, compilationError); msg != "" {
				test.Errors = []TestError{{Message: msg}}
			}
		}

		result = append(result, test)
	}

	return result
}

// getTestErrorMessage gets the error message for a failed test
func getTestErrorMessage(pkg, name string, p *parser.Parser, compilationError *parser.CompilationError) string {
	// Special case: synthetic CompilationError test
	if name == "CompilationError" && compilationError != nil {
		return compilationError.Message
	}
	return p.GetTestOutput(pkg, name)
}

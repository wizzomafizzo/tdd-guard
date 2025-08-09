package transformer

import (
	"github.com/nizos/tdd-guard/reporters/go/internal/parser"
)

// Test represents a single test
type Test struct {
	Name     string `json:"name"`
	FullName string `json:"fullName"`
	State    string `json:"state"`
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
func (t *Transformer) Transform(results parser.Results) *TestResult {
	modules := []TestModule{}
	hasFailures := false

	for pkg, packageTests := range results {
		tests := []Test{}

		for testName, testState := range packageTests {
			test := Test{
				Name:     testName,
				FullName: pkg + "/" + testName,
				State:    string(testState),
			}
			tests = append(tests, test)

			if testState == parser.StateFailed {
				hasFailures = true
			}
		}

		module := TestModule{
			ModuleID: pkg,
			Tests:    tests,
		}
		modules = append(modules, module)
	}

	reason := "passed"
	if hasFailures {
		reason = "failed"
	}

	return &TestResult{
		TestModules: modules,
		Reason:      reason,
	}
}

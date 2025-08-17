package formatter

import (
	"testing"

	"github.com/nizos/tdd-guard/reporters/go/internal/parser"
)

func TestNewFormatter(t *testing.T) {
	formatter := NewFormatter()
	if formatter == nil {
		t.Fatal("Expected NewFormatter to return a formatter instance")
	}
}

func TestFormatMethodExists(t *testing.T) {
	formatter := NewFormatter()
	event := parser.TestEvent{}
	_ = formatter.Format(event)
}

func TestFilterStartEvents(t *testing.T) {
	formatter := NewFormatter()
	event := parser.TestEvent{
		Action: "start",
	}
	result := formatter.Format(event)
	if result != "" {
		t.Fatal("Expected start events to be filtered out")
	}
}

func TestFilterRunEvents(t *testing.T) {
	formatter := NewFormatter()
	event := parser.TestEvent{
		Action: "run",
	}
	result := formatter.Format(event)
	if result != "" {
		t.Fatal("Expected run events to be filtered out")
	}
}

func TestFilterPASSOutput(t *testing.T) {
	formatter := NewFormatter()
	event := parser.TestEvent{
		Action: "output",
		Output: "PASS\n",
	}
	result := formatter.Format(event)
	if result != "" {
		t.Fatalf("Expected PASS output to be filtered, got '%s'", result)
	}
}

func TestPassThroughFAILOutput(t *testing.T) {
	formatter := NewFormatter()
	event := parser.TestEvent{
		Action: "output",
		Output: "FAIL\n",
	}
	result := formatter.Format(event)
	if result != "FAIL" {
		t.Fatalf("Expected 'FAIL' but got '%s'", result)
	}
}

func TestPassThroughTestFailureOutput(t *testing.T) {
	formatter := NewFormatter()
	event := parser.TestEvent{
		Action: "output",
		Test:   "TestCalculator/TestShouldAddNumbersCorrectly",
		Output: "    single_failing_test.go:10: Expected 6 but got 5\n",
	}
	result := formatter.Format(event)
	expected := "    single_failing_test.go:10: Expected 6 but got 5"
	if result != expected {
		t.Fatalf("Expected '%s' but got '%s'", expected, result)
	}
}

func TestFormatPackagePassSummary(t *testing.T) {
	formatter := NewFormatter()
	event := parser.TestEvent{
		Action:  "pass",
		Package: "command-line-arguments",
		Elapsed: 0.002,
	}
	result := formatter.Format(event)
	expected := "ok  \tcommand-line-arguments\t0.002s"
	if result != expected {
		t.Fatalf("Expected '%s' but got '%s'", expected, result)
	}
}

func TestFormatPackageFailSummary(t *testing.T) {
	formatter := NewFormatter()
	event := parser.TestEvent{
		Action:  "fail",
		Package: "command-line-arguments",
		Elapsed: 0.002,
	}
	result := formatter.Format(event)
	expected := "FAIL\tcommand-line-arguments\t0.002s"
	if result != expected {
		t.Fatalf("Expected '%s' but got '%s'", expected, result)
	}
}

func TestSkipPackageFailWithBuildFailure(t *testing.T) {
	formatter := NewFormatter()
	event := parser.TestEvent{
		Action:      "fail",
		Package:     "command-line-arguments",
		Elapsed:     0,
		FailedBuild: "github.com/non-existent/module",
	}
	result := formatter.Format(event)
	if result != "" {
		t.Fatalf("Expected build failure package fail to be filtered, got '%s'", result)
	}
}

func TestFilterTestLevelPassEvents(t *testing.T) {
	formatter := NewFormatter()
	event := parser.TestEvent{
		Action:  "pass",
		Package: "command-line-arguments",
		Test:    "TestCalculator",
		Elapsed: 0.001,
	}
	result := formatter.Format(event)
	if result != "" {
		t.Fatalf("Expected test-level pass events to be filtered out, got '%s'", result)
	}
}

func TestFilterTestLevelFailEvents(t *testing.T) {
	formatter := NewFormatter()
	event := parser.TestEvent{
		Action:  "fail",
		Package: "command-line-arguments",
		Test:    "TestCalculator",
		Elapsed: 0.001,
	}
	result := formatter.Format(event)
	if result != "" {
		t.Fatalf("Expected test-level fail events to be filtered out, got '%s'", result)
	}
}

func TestFilterRunOutputEvents(t *testing.T) {
	formatter := NewFormatter()
	event := parser.TestEvent{
		Action:  "output",
		Package: "singlePassingTestModule",
		Test:    "TestCalculator",
		Output:  "=== RUN   TestCalculator\n",
	}
	result := formatter.Format(event)
	if result != "" {
		t.Fatalf("Expected RUN output events to be filtered out, got '%s'", result)
	}
}

func TestFilterPassOutputEvents(t *testing.T) {
	formatter := NewFormatter()
	event := parser.TestEvent{
		Action:  "output",
		Package: "singlePassingTestModule",
		Test:    "TestCalculator",
		Output:  "--- PASS: TestCalculator (0.00s)\n",
	}
	result := formatter.Format(event)
	if result != "" {
		t.Fatalf("Expected PASS output events to be filtered out, got '%s'", result)
	}
}

func TestShowFailOutputEvents(t *testing.T) {
	formatter := NewFormatter()
	event := parser.TestEvent{
		Action:  "output",
		Package: "singlePassingTestModule",
		Test:    "TestCalculator",
		Output:  "--- FAIL: TestCalculator (0.00s)\n",
	}
	result := formatter.Format(event)
	expected := "--- FAIL: TestCalculator (0.00s)"
	if result != expected {
		t.Fatalf("Expected '%s', got '%s'", expected, result)
	}
}

func TestFilterPackageOkOutput(t *testing.T) {
	formatter := NewFormatter()
	event := parser.TestEvent{
		Action:  "output",
		Package: "singlePassingTestModule",
		Output:  "ok  \tsinglePassingTestModule\t0.002s\n",
	}
	result := formatter.Format(event)
	if result != "" {
		t.Fatalf("Expected package ok output to be filtered out, got '%s'", result)
	}
}

func TestFilterPackageFailOutput(t *testing.T) {
	formatter := NewFormatter()
	event := parser.TestEvent{
		Action:  "output",
		Package: "example.com/pkg",
		Output:  "FAIL\texample.com/pkg\t0.002s\n",
	}
	result := formatter.Format(event)
	if result != "" {
		t.Fatalf("Expected package FAIL output to be filtered out, got '%s'", result)
	}
}

func TestPassThroughSetupFailedOutput(t *testing.T) {
	formatter := NewFormatter()
	event := parser.TestEvent{
		Action:  "output",
		Package: "command-line-arguments",
		Output:  "FAIL\tcommand-line-arguments [setup failed]\n",
	}
	result := formatter.Format(event)
	expected := "FAIL\tcommand-line-arguments [setup failed]"
	if result != expected {
		t.Fatalf("Expected '%s', got '%s'", expected, result)
	}
}

func TestPassThroughBuildOutput(t *testing.T) {
	formatter := NewFormatter()
	event := parser.TestEvent{
		Action: "build-output",
		Output: "# command-line-arguments\n",
	}
	result := formatter.Format(event)
	expected := "# command-line-arguments"
	if result != expected {
		t.Fatalf("Expected '%s', got '%s'", expected, result)
	}
}

func TestFilterBuildFailEvents(t *testing.T) {
	formatter := NewFormatter()
	event := parser.TestEvent{
		Action: "build-fail",
	}
	result := formatter.Format(event)
	if result != "" {
		t.Fatalf("Expected build-fail events to be filtered out, got '%s'", result)
	}
}

func TestPassThroughExitStatusOutput(t *testing.T) {
	formatter := NewFormatter()
	event := parser.TestEvent{
		Action:  "output",
		Package: "combined",
		Output:  "exit status 1\n",
	}
	result := formatter.Format(event)
	expected := "exit status 1"
	if result != expected {
		t.Fatalf("Expected '%s', got '%s'", expected, result)
	}
}

func TestPassThroughUnknownOutputEvents(t *testing.T) {
	formatter := NewFormatter()
	event := parser.TestEvent{
		Action:  "output",
		Package: "example",
		Output:  "some unknown output\n",
	}
	result := formatter.Format(event)
	expected := "some unknown output"
	if result != expected {
		t.Fatalf("Expected '%s', got '%s'", expected, result)
	}
}

func TestPassThroughUnknownActions(t *testing.T) {
	formatter := NewFormatter()
	event := parser.TestEvent{
		Action: "unknown-action",
		Output: "data from unknown action\n",
	}
	result := formatter.Format(event)
	expected := "unknown-action: data from unknown action"
	if result != expected {
		t.Fatalf("Expected '%s', got '%s'", expected, result)
	}
}

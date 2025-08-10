package parser

import (
	"bufio"
	"encoding/json"
	"io"
)

// MixedReader handles both JSON and plain text input from go test
type MixedReader struct {
	jsonLines         []string
	nonJSONLines      []string
	hasCompilationErr bool
	errorPackage      string
	errorMessage      string
}

// NewMixedReader creates a new MixedReader and processes the input
func NewMixedReader(reader io.Reader) *MixedReader {
	mr := &MixedReader{}
	scanner := bufio.NewScanner(reader)
	foundErrorHeader := false

	for scanner.Scan() {
		line := scanner.Text()

		// Try to parse as JSON
		var event TestEvent
		if err := json.Unmarshal([]byte(line), &event); err == nil {
			// It's valid JSON
			mr.jsonLines = append(mr.jsonLines, line)
		} else {
			// It's not JSON
			mr.nonJSONLines = append(mr.nonJSONLines, line)

			// Check for compilation error pattern
			if len(line) > 0 && line[0] == '#' {
				mr.hasCompilationErr = true
				foundErrorHeader = true
				// Extract package name (everything after "# ")
				if len(line) > 2 {
					mr.errorPackage = line[2:]
				}
			} else if foundErrorHeader && mr.errorMessage == "" && line != "" && line[:4] != "FAIL" {
				// The next non-empty line after # is the error message
				mr.errorMessage = line
			}
		}
	}
	return mr
}

// GetJSONLines returns the collected JSON lines
func (mr *MixedReader) GetJSONLines() []string {
	return mr.jsonLines
}

// GetNonJSONLines returns the collected non-JSON lines
func (mr *MixedReader) GetNonJSONLines() []string {
	return mr.nonJSONLines
}

// HasCompilationError checks if compilation error was detected
func (mr *MixedReader) HasCompilationError() bool {
	return mr.hasCompilationErr
}

// GetCompilationErrorPackage returns the package name from compilation error
func (mr *MixedReader) GetCompilationErrorPackage() string {
	return mr.errorPackage
}

// GetCompilationErrorMessage returns the compilation error message
func (mr *MixedReader) GetCompilationErrorMessage() string {
	return mr.errorMessage
}

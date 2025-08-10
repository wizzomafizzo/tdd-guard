package main

import (
	"bytes"
	"errors"
	"flag"
	"io"
	"os"
	"path/filepath"
	"strings"

	tddio "github.com/nizos/tdd-guard/reporters/go/internal/io"
	"github.com/nizos/tdd-guard/reporters/go/internal/parser"
	"github.com/nizos/tdd-guard/reporters/go/internal/storage"
	"github.com/nizos/tdd-guard/reporters/go/internal/transformer"
)

func main() {
	var projectRoot string
	flag.StringVar(&projectRoot, "project-root", "", "Project root directory (absolute path)")
	flag.Parse()

	if err := process(os.Stdin, projectRoot, os.Stdout); err != nil {
		os.Exit(1)
	}
}

func process(input io.Reader, projectRoot string, output io.Writer) error {
	if err := validateProjectRoot(projectRoot); err != nil {
		return err
	}

	// Buffer to collect input while passing through to output
	buffer := &bytes.Buffer{}
	teeReader := tddio.NewTeeReader(input, io.MultiWriter(output, buffer))

	// Read all input through the tee reader
	io.ReadAll(teeReader)

	// Parse test output from buffer
	mixedReader := parser.NewMixedReader(buffer)
	results, p, err := parseTestResults(mixedReader)
	if err != nil {
		return err
	}

	// Add synthetic test for compilation errors
	if shouldAddCompilationError(results, mixedReader.CompilationError) {
		addCompilationError(results, mixedReader.CompilationError)
	}

	// Transform and save results
	t := transformer.NewTransformer()
	result := t.Transform(results, p, mixedReader.CompilationError)

	s := storage.NewStorage(projectRoot)
	return s.Save(result)
}

func validateProjectRoot(projectRoot string) error {
	if projectRoot == "" {
		return nil
	}

	if !filepath.IsAbs(projectRoot) {
		return errors.New("project root must be an absolute path")
	}

	cwd, _ := os.Getwd()
	if !strings.HasPrefix(cwd, projectRoot) {
		return errors.New("current directory must be within project root")
	}

	return nil
}

func parseTestResults(mixedReader *parser.MixedReader) (parser.Results, *parser.Parser, error) {
	p := parser.NewParser()

	jsonInput := strings.Join(mixedReader.JSONLines, "\n")
	if jsonInput != "" {
		if err := p.Parse(strings.NewReader(jsonInput)); err != nil {
			return nil, nil, err
		}
	}

	return p.GetResults(), p, nil
}

func shouldAddCompilationError(results parser.Results, compilationError *parser.CompilationError) bool {
	return len(results) == 0 && compilationError != nil
}

func addCompilationError(results parser.Results, compilationError *parser.CompilationError) {
	results[compilationError.Package] = parser.PackageResults{
		"CompilationError": parser.StateFailed,
	}
}

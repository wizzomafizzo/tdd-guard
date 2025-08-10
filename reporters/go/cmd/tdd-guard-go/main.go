package main

import (
	"errors"
	"flag"
	"io"
	"os"
	"path/filepath"
	"strings"

	"github.com/nizos/tdd-guard/reporters/go/internal/parser"
	"github.com/nizos/tdd-guard/reporters/go/internal/storage"
	"github.com/nizos/tdd-guard/reporters/go/internal/transformer"
)

func main() {
	var projectRoot string
	flag.StringVar(&projectRoot, "project-root", "", "Project root directory (absolute path)")
	flag.Parse()

	if err := process(os.Stdin, projectRoot); err != nil {
		os.Exit(1)
	}
}

func process(input io.Reader, projectRoot string) error {
	// Validate project root if provided
	if projectRoot != "" {
		if !filepath.IsAbs(projectRoot) {
			return errors.New("project root must be an absolute path")
		}

		// Check if current directory is within project root
		cwd, _ := os.Getwd()
		if !strings.HasPrefix(cwd, projectRoot) {
			return errors.New("current directory must be within project root")
		}
	}

	p := parser.NewParser()
	err := p.Parse(input)
	if err != nil {
		return err
	}

	t := transformer.NewTransformer()
	result := t.Transform(p.GetResults(), p)

	s := storage.NewStorage(projectRoot)
	return s.Save(result)
}

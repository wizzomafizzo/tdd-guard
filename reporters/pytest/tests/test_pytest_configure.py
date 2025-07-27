"""Test pytest_configure hook functionality"""
from tdd_guard_pytest import pytest_reporter
from .helpers import create_config


def test_pytest_configure_creates_plugin_with_config():
    """Test that pytest_configure creates plugin instance with config"""
    config = create_config("")
    
    # Before configure, plugin should be None
    original_plugin = pytest_reporter.tdd_guard_plugin
    pytest_reporter.tdd_guard_plugin = None
    
    try:
        # Call pytest_configure
        pytest_reporter.pytest_configure(config)
        
        # Plugin should now be created
        assert pytest_reporter.tdd_guard_plugin is not None
        assert isinstance(pytest_reporter.tdd_guard_plugin, pytest_reporter.TDDGuardPytestPlugin)
    finally:
        # Restore original plugin
        pytest_reporter.tdd_guard_plugin = original_plugin
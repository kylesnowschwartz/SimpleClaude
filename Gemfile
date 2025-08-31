# SimpleClaude Ruby Hooks Dependencies
# This Gemfile gets installed to ~/.claude/ to support Ruby-based hooks

source 'https://rubygems.org'

ruby '>= 2.7.0'

# Claude Hooks DSL framework
gem 'claude_hooks', '~> 1.0.0'

# Development and utility gems for hook development
group :development do
  gem 'rake', '~> 13.0'
  gem 'rspec', '~> 3.0'
end

# Optional gems for common hook use cases
group :optional do
  gem 'json', '~> 2.0'         # JSON processing (claude_hooks dependency)
  gem 'rubocop', '~> 1.0'      # Code linting and formatting
end

#!/usr/bin/env ruby
# frozen_string_literal: true

# TranscriptParser - Defensive JSON parsing utilities for Claude Code transcripts
#
# PURPOSE: Provide safe, robust parsing of Claude Code transcript JSON data
# HANDLES: Variable content formats (String vs Array), malformed data, type validation
#
# KEY FEATURES:
# - Defensive type checking before processing
# - Graceful degradation for unexpected formats
# - Comprehensive error handling with meaningful messages
# - Ruby best practices for type validation
# - Extensible for future transcript format changes

module TranscriptParser
  # Custom errors for specific parsing scenarios
  class TranscriptParseError < StandardError; end
  class MalformedTranscriptError < TranscriptParseError; end
  class UnsupportedContentFormatError < TranscriptParseError; end
  class MissingRequiredFieldError < TranscriptParseError; end

  # Main entry point for parsing transcript JSON data
  # @param data [Hash] The parsed JSON data from transcript
  # @param strict [Boolean] Whether to raise errors on malformed data (default: false)
  # @return [Hash] Normalized data structure with validated content
  def self.parse_transcript_entry(data, strict: false)
    validate_transcript_structure!(data)

    result = {
      request_id: extract_request_id(data),
      timestamp: extract_timestamp(data),
      message: parse_message(data['message'], strict: strict)
    }

    # Add optional fields if present
    result[:tool_name] = data['toolName'] if data.key?('toolName')
    result[:tool_input] = data['toolInput'] if data.key?('toolInput')
    result[:tool_response] = data['toolResponse'] if data.key?('toolResponse')

    result
  rescue StandardError => e
    raise TranscriptParseError, "Failed to parse transcript entry: #{e.message}" if strict

    # Return safe fallback structure
    {
      request_id: data['requestId'] || 'unknown',
      timestamp: data['timestamp'] || Time.now.to_f,
      message: { role: 'unknown', content: '', type: 'fallback' },
      parse_error: e.message
    }
  end

  # Extract and normalize message content with defensive type handling
  # @param message [Hash] The message object from transcript data
  # @param strict [Boolean] Whether to raise errors on unsupported formats
  # @return [Hash] Normalized message with extracted content
  def self.parse_message(message, strict: false)
    validate_message_structure!(message)

    role = extract_role(message)
    content = extract_content(message['content'], strict: strict)

    {
      role: role,
      content: content[:text],
      content_type: content[:type],
      raw_content: message['content'] # Preserve original for debugging
    }
  end

  # Safely extract text content from variable format content field
  # @param content_data [String, Array, Object] The content field from message
  # @param strict [Boolean] Whether to raise errors on unsupported formats
  # @return [Hash] Hash with :text and :type keys
  def self.extract_content(content_data, strict: false)
    case content_data
    when String
      { text: content_data, type: 'string' }
    when Array
      { text: extract_content_from_array(content_data), type: 'array' }
    when Hash
      { text: extract_content_from_hash(content_data), type: 'hash' }
    when nil
      { text: '', type: 'nil' }
    else
      if strict
        raise UnsupportedContentFormatError,
              "Unsupported content format: #{content_data.class} - #{content_data.inspect}"
      else
        { text: content_data.to_s, type: 'converted' }
      end
    end
  end

  # Extract text from array-based content (Claude's structured message format)
  # @param content_array [Array] Array of content blocks
  # @return [String] Concatenated text content
  def self.extract_content_from_array(content_array)
    return '' unless content_array.is_a?(Array)

    content_array.filter_map do |block|
      case block
      when Hash
        # Skip tool_use and thinking entries as they don't contain displayable text
        block_type = block['type'] || block[:type]
        next if %w[tool_use thinking].include?(block_type)

        # Handle structured content blocks (e.g., {type: 'text', text: 'content'})
        block['text'] || block[:text] || block.dig('content', 'text') ||
          block.values.find { |v| v.is_a?(String) && v.length.positive? }
      when String
        block
      else
        block.to_s if block.respond_to?(:to_s)
      end
    end.join
  end

  # Extract text from hash-based content
  # @param content_hash [Hash] Hash containing content data
  # @return [String] Extracted text content
  def self.extract_content_from_hash(content_hash)
    return '' unless content_hash.is_a?(Hash)

    # Try common content keys in order of preference
    %w[text content message body data value].each do |key|
      return content_hash[key] if content_hash.key?(key) && content_hash[key].is_a?(String)
    end

    # Fallback: convert whole hash to string for debugging
    content_hash.to_s
  end

  # Validate basic transcript entry structure
  # @param data [Hash] The transcript entry data
  # @raise [MalformedTranscriptError] If required fields are missing
  def self.validate_transcript_structure!(data)
    raise MalformedTranscriptError, 'Data must be a Hash' unless data.is_a?(Hash)

    return if data.key?('message')

    raise MissingRequiredFieldError, "Missing required 'message' field"
  end

  # Validate message structure
  # @param message [Hash] The message object
  # @raise [MalformedTranscriptError] If message structure is invalid
  def self.validate_message_structure!(message)
    raise MalformedTranscriptError, 'Message must be a Hash' unless message.is_a?(Hash)

    raise MissingRequiredFieldError, "Missing required 'role' field in message" unless message.key?('role')

    return if message.key?('content')

    raise MissingRequiredFieldError, "Missing required 'content' field in message"
  end

  # Extract request ID with fallback
  # @param data [Hash] The transcript entry data
  # @return [String] Request ID or generated fallback
  def self.extract_request_id(data)
    data['requestId'] || data['request_id'] || "req_#{Time.now.to_f}"
  end

  # Extract timestamp with fallback
  # @param data [Hash] The transcript entry data
  # @return [Float] Timestamp or current time
  def self.extract_timestamp(data)
    timestamp = data['timestamp'] || data['created_at'] || Time.now.to_f
    timestamp.is_a?(Numeric) ? timestamp : Time.now.to_f
  end

  # Extract role with validation
  # @param message [Hash] The message object
  # @return [String] The role (user, assistant, system)
  def self.extract_role(message)
    role = message['role'] || message[:role]
    return role if %w[user assistant system].include?(role)

    # Fallback role detection
    'unknown'
  end

  # Batch process multiple transcript entries with error isolation
  # @param lines [Array<String>] Array of JSON strings from transcript file
  # @param strict [Boolean] Whether to raise errors on malformed entries
  # @return [Array<Hash>] Array of parsed entries, with errors isolated
  def self.parse_transcript_lines(lines, strict: false)
    results = []

    lines.each_with_index do |line, index|
      next if line.nil? || line.strip.empty?

      begin
        data = JSON.parse(line.strip)
        results << parse_transcript_entry(data, strict: strict)
      rescue JSON::ParserError => e
        error_entry = {
          line_number: index + 1,
          parse_error: "JSON parse error: #{e.message}",
          raw_line: line.strip[0..100] + (line.length > 100 ? '...' : ''),
          message: { role: 'error', content: '', type: 'json_error' }
        }

        raise TranscriptParseError, "JSON parse error on line #{index + 1}: #{e.message}" if strict

        results << error_entry
      rescue StandardError => e
        error_entry = {
          line_number: index + 1,
          parse_error: "Unexpected error: #{e.message}",
          raw_line: line.strip[0..100] + (line.length > 100 ? '...' : ''),
          message: { role: 'error', content: '', type: 'parse_error' }
        }

        raise TranscriptParseError, "Parse error on line #{index + 1}: #{e.message}" if strict

        results << error_entry
      end
    end

    results
  end

  # Helper method to safely read and parse transcript file
  # @param file_path [String] Path to transcript file
  # @param strict [Boolean] Whether to raise errors on malformed data
  # @return [Array<Hash>] Array of parsed transcript entries
  def self.parse_transcript_file(file_path, strict: false)
    raise TranscriptParseError, "Transcript file not found: #{file_path}" unless File.exist?(file_path)

    lines = File.readlines(file_path, chomp: true)
    parse_transcript_lines(lines, strict: strict)
  end
end

"""
Fix remaining lint errors related to error variables in catch blocks.
This script:
1. Finds catch(_error) blocks where error (not _error) is referenced
2. Replaces those references with _error
"""
import re
import os
from pathlib import Path

def fix_error_references(file_path):
    """Fix error variable references in a single file."""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    changes_made = 0

    # Pattern: Find catch blocks with _error parameter
    # Then fix any references to 'error' within those blocks

    # Find all catch(_error) blocks
    catch_pattern = r'catch\s*\(\s*_error\s*\)\s*\{'

    # Split content by catch blocks
    parts = re.split(catch_pattern, content)

    if len(parts) > 1:
        # Reconstruct with fixes
        result = [parts[0]]

        for i in range(1, len(parts)):
            part = parts[i]

            # Find the end of this catch block (matching closing brace)
            brace_count = 1
            end_pos = 0

            for j, char in enumerate(part):
                if char == '{':
                    brace_count += 1
                elif char == '}':
                    brace_count -= 1
                    if brace_count == 0:
                        end_pos = j
                        break

            if end_pos > 0:
                catch_body = part[:end_pos]
                rest = part[end_pos:]

                # Fix error references in catch body
                # Replace error.message, error.stack, error) but not _error
                fixed_body = re.sub(r'\berror\.', '_error.', catch_body)
                fixed_body = re.sub(r'\(error\)', '(_error)', fixed_body)
                fixed_body = re.sub(r', error\)', ', _error)', fixed_body)
                fixed_body = re.sub(r'throw error;', 'throw _error;', fixed_body)
                fixed_body = re.sub(r'return error;', 'return _error;', fixed_body)

                if fixed_body != catch_body:
                    changes_made += 1

                result.append('catch (_error) {')
                result.append(fixed_body)
                result.append(rest)
            else:
                result.append('catch (_error) {')
                result.append(part)

        content = ''.join(result)

    # Also fix standalone throw error; and return error; outside catch blocks
    # But be careful not to break things

    if content != original_content:
        with open(file_path, 'w', encoding='utf-8', newline='') as f:
            f.write(content)
        return changes_made

    return 0

def main():
    """Process all JavaScript files in extension directory."""
    extension_dir = Path('extension')
    total_changes = 0
    files_changed = 0

    for js_file in extension_dir.rglob('*.js'):
        changes = fix_error_references(js_file)
        if changes > 0:
            total_changes += changes
            files_changed += 1
            print(f'Fixed {changes} error(s) in {js_file}')

    print(f'\nTotal: Fixed {total_changes} errors in {files_changed} files')

if __name__ == '__main__':
    main()

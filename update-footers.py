#!/usr/bin/env python3
"""
Script to update footer network links in all article HTML files
Architetti Taormina - Studio 4e Network Integration
"""

import os
import glob
from pathlib import Path

# Files to exclude from processing
EXCLUDE_FILES = [
    'index.html',
    '404.html',
    'article-template.html',
    'contatti.html',
    'guide.html',
    'villas.html'
]

# Old footer pattern
OLD_FOOTER = '''    <footer class="footer">
        <div class="container">© 2026 Architetti Taormina by Studio 4e.</div>
    </footer>'''

# New footer with network links
NEW_FOOTER = '''    <footer class="footer">
        <div class="container">
© 2026 Architetti Taormina by Studio 4e.
<div style="margin-top:12px; padding-top:12px; border-top:1px solid rgba(0,0,0,.06); font-size:11px; color:#888; font-family:'Montserrat', sans-serif;">
Studio 4e in Sicilia:
<a href="https://architettisicilia.it" style="color:#888; text-decoration:none; transition:color 0.3s;" onmouseover="this.style.color='#7a1d52'" onmouseout="this.style.color='#888'">Architetti Sicilia</a> ·
<a href="https://architettipalermo.com" style="color:#888; text-decoration:none; transition:color 0.3s;" onmouseover="this.style.color='#7a1d52'" onmouseout="this.style.color='#888'">Architetti Palermo</a> ·
<a href="https://architetticatania.it" style="color:#888; text-decoration:none; transition:color 0.3s;" onmouseover="this.style.color='#7a1d52'" onmouseout="this.style.color='#888'">Architetti Catania</a> ·
<a href="https://architettitrapani.com" style="color:#888; text-decoration:none; transition:color 0.3s;" onmouseover="this.style.color='#7a1d52'" onmouseout="this.style.color='#888'">Architetti Trapani</a> ·
<span style="color:#666">Architetti Taormina</span>
</div>
        </div>
    </footer>'''


def update_footer(file_path):
    """Update footer in a single HTML file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Check if file already has network links
        if 'Studio 4e in Sicilia' in content:
            return 'skipped'

        # Check if old footer pattern exists
        if OLD_FOOTER not in content:
            return 'not_found'

        # Replace old footer with new footer
        new_content = content.replace(OLD_FOOTER, NEW_FOOTER)

        # Write updated content
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)

        return 'updated'

    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return 'error'


def main():
    # Get all HTML files in current directory
    root_dir = Path('/home/user/architetti-taormina')
    html_files = list(root_dir.glob('*.html'))

    # Filter out excluded files
    article_files = [f for f in html_files if f.name not in EXCLUDE_FILES]

    print(f"Found {len(article_files)} article files to process")
    print(f"Excluded {len(EXCLUDE_FILES)} special files\n")

    # Process all files
    stats = {
        'updated': 0,
        'skipped': 0,
        'not_found': 0,
        'error': 0
    }

    for file_path in sorted(article_files):
        result = update_footer(file_path)
        stats[result] += 1

        if result == 'updated':
            print(f"✓ Updated: {file_path.name}")
        elif result == 'skipped':
            print(f"- Skipped: {file_path.name} (already has network links)")
        elif result == 'not_found':
            print(f"⚠ Warning: {file_path.name} (footer pattern not found)")
        elif result == 'error':
            print(f"✗ Error: {file_path.name}")

    # Print summary
    print(f"\n{'='*60}")
    print("SUMMARY")
    print(f"{'='*60}")
    print(f"Updated:    {stats['updated']}")
    print(f"Skipped:    {stats['skipped']}")
    print(f"Not found:  {stats['not_found']}")
    print(f"Errors:     {stats['error']}")
    print(f"{'='*60}")


if __name__ == '__main__':
    main()

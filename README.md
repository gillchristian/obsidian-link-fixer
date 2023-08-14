# obsidian-link-fixer

An Obsidian (https://obsidian.md) plugin to convert all WikiLinks to absolute path format.

Inspired and forked from [ozntel/obsidian-link-converter](https://github.com/ozntel/obsidian-link-converter).

## Usage

Adds a command that updates all the wiki links in the Vault to absolute path format, respecting aliases.

![](/static/command.png)

## Known issues

- Breaks links to embedded files
  - This `![[static/picture.png]]` is turned into this `!\[\[static/picture.png]]`
  - The WikiLink parser ([remark-wiki-link](https://github.com/landakram/remark-wiki-link)) does not support the link format.
  - The plugin needs to be updated to search and support non-Markdown links and files

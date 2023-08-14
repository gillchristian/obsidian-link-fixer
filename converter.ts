import {TFile, Notice, App, normalizePath, TAbstractFile, TFolder} from "obsidian"

import {unified} from "unified"
import remarkParse from "remark-parse"
import remarkGfm from "remark-gfm"
import remarkFrontmatter from "remark-frontmatter"
import remarkStringify from "remark-stringify"
import remarkWikiLink from "remark-wiki-link"
import {map as mapAst} from "unist-util-map"

import Plugin from "main"

export const convertLinksInVault = async (plugin: Plugin) => {
    let mdFiles: TFile[] = plugin.app.vault.getMarkdownFiles()
    let notice = new Notice("Starting to fix links", 0)

    mdFiles = mdFiles.filter(
        mdFile =>
            !hasFrontmatter(plugin.app, mdFile.path, "excalidraw-plugin") &&
            !hasFrontmatter(plugin.app, mdFile.path, "kanban-plugin")
    )

    try {
        let totalCount = mdFiles.length
        let counter = 0
        for (let mdFile of mdFiles) {
            counter++
            notice.setMessage(`Fixing wiki links in notes ${counter}/${totalCount}.`)
            await convertLinksAndSaveInSingleFile(mdFiles, mdFile, plugin)
        }
    } catch (err) {
        console.log(err)
    } finally {
        notice.hide()
    }
}

export const convertLinksAndSaveInSingleFile = async (
    allFiles: TFile[],
    mdFile: TFile,
    plugin: Plugin
) => {
    let fileText = await plugin.app.vault.read(mdFile)
    let newFileText = convertLinks(allFiles, mdFile, fileText, plugin)

    let fileStat = await plugin.app.vault.adapter.stat(normalizePath(mdFile.path))
    await plugin.app.vault.modify(mdFile, newFileText, fileStat ?? undefined)
}

const hasFrontmatter = (app: App, filePath: string, keyToCheck: string) => {
    let metaCache = app.metadataCache.getCache(filePath)
    return metaCache?.frontmatter && metaCache?.frontmatter[keyToCheck]
}

export const convertLinks = (
    allFiles: TFile[],
    currentFile: TFile,
    md: string,
    plugin: Plugin
): string => {
    const MdProcessor = unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkFrontmatter, ["yaml"])
        .use(remarkWikiLink, {aliasDivider: "|"})
        .use(remarkStringify)

    try {
        const rootAst = MdProcessor.parse(md)

        // The wikilink extension isn't typed =/
        const next = mapAst(rootAst, (node: any) => {
            if (node.type !== "wikiLink") {
                return node
            }

            const linkFile = findFile(plugin, allFiles, node.value)

            // `node.value`      is the link text
            // `node.data.alias` is the displayed text
            if (linkFile) {
                return {
                    ...node,
                    value: buildPath(linkFile),
                    data: {
                        ...node.data,
                        alias: node.value === node.data.value ? linkFile.basename : node.data.alias,
                    },
                }
            }

            const parts: string[] = node.value.split("/")
            const folders = parts.slice(0, -1)
            const name = parts[parts.length - 1]

            const newFilesFolder = buildFolderPath(
                plugin.app.fileManager.getNewFileParent(
                    `${buildPath(currentFile)}.${currentFile.extension}`
                )
            )

            return {
                ...node,
                value: folders.length === 0 ? `${newFilesFolder}/${node.value}` : node.value,
                data: {
                    ...node.data,
                    alias: node.value === node.data.value ? name : node.data.alias,
                },
            }
        })

        return MdProcessor.stringify(next)
    } catch (err) {
        console.log(err)
        return md
    }
}

const findFile = (plugin: Plugin, files: TFile[], name: string): TFile | null => {
    const file = plugin.app.vault.getAbstractFileByPath(`${name}.md`)

    if (file instanceof TFile) {
        return file
    }

    return files.find(file => file.basename === name) ?? null
}

const buildPath = (file: TAbstractFile): string =>
    file instanceof TFile
        ? file.parent
            ? `${buildPath(file.parent)}${file.basename}`
            : file.basename
        : file.parent
        ? `${buildPath(file.parent)}${file.name}/`
        : ""

const buildFolderPath = (file: TFolder): string =>
    file.parent ? `${buildPath(file.parent)}${file.name}` : file.name === "" ? "" : `${file.name}/`

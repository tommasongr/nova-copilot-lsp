const { rangeToLspRange } = require("./helpers")
/** @typedef {import("./copilot/LanguageServer")} LanguageServer */

/** @implements {CompletionAssistant} */
class CompletionProvider {
    /** @param {LanguageServer} langserver */
    constructor(langserver) {
        this.langserver = langserver
    }

    /**
     * @param {TextEditor} editor
     * @param {CompletionContext} context
     * @returns {Promise<CompletionItem[]|null>}
     */
    async provideCompletionItems(editor, context) {
        if (context.reason == CompletionReason.Character) return null

        const range = new Range(context.position, context.position)
        const completion = await this.langserver.getCompletion(editor, range)

        if (completion) {
            const item = new CompletionItem("Copilot", CompletionItemKind.Expression)

            item.insertText = completion.text
            item.documentation = completion.displayText

            return [item]
        }

        return null
    }

    /**
     * @param {TextEditor} editor
     * @param {CompletionContext} context
     * @returns {Promise}
     // */
    completions(editor, context) {
        try {
            const position = rangeToLspRange(editor.document, new Range(context.position, context.position))
            const params = {
                "doc": {
                    "source": editor.document.getTextInRange(new Range(0, editor.document.length)),
                    "tabSize": editor.tabLength,
                    "indentSize": 1, // there is no such concept in ST
                    "insertSpaces": editor.softTabs,
                    "path": editor.document.path,
                    "uri": editor.document.uri,
                    "relativePath": editor.document.path,
                    "languageId": editor.document.syntax,
                    "position": { "line": position.end.line + 1, "character": position.end.character + 1 },
                    // Buffer Version. Generally this is handled by LSP, but we need to handle it here
                    // Will need to test getting the version from LSP
                    "version": 0,
                }
            }
            return this.langserver.languageClient.sendRequest("getCompletions", params)
        } catch (error) {
            console.error(error)
        }
    }
}

module.exports = CompletionProvider

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { CancellationToken, CompletionItem, CompletionItemKind, CompletionItemProvider, Position, TextDocument } from 'vscode';
import { KeyInfo } from '../extension';
import helper = require('../utils/suggestSupportHelper');
import composeVersions from './dockerComposeKeyInfo';

export class DockerComposeCompletionItemProvider implements CompletionItemProvider {

    public triggerCharacters: string[] = [];
    public excludeTokens: string[] = [];

    /* eslint-disable-next-line @typescript-eslint/promise-function-async */ // Grandfathered in
    public provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken): Promise<CompletionItem[]> {
        const yamlSuggestSupport = new helper.SuggestSupportHelper();

        // Determine the schema version of the current compose file,
        // based on the existence of a top-level "version" property.
        const versionMatch = document.getText().match(/^version:\s*(["'])(\d+(\.\d)?)\1/im);
        const version = versionMatch ? versionMatch[2] : "1";

        // Get the line where intellisense was invoked on (e.g. 'image: u').
        const line = document.lineAt(position.line).text;

        if (line.length === 0) {
            // empty line
            return Promise.resolve(this.suggestKeys('', version));
        }

        const range = document.getWordRangeAtPosition(position);

        // Get the text where intellisense was invoked on (e.g. 'u').
        const word = range && document.getText(range) || '';

        const textBefore = line.substring(0, position.character);
        if (/^\s*[\w_]*$/.test(textBefore)) {
            // on the first token
            return Promise.resolve(this.suggestKeys(word, version));
        }

        // Matches strings like: 'image: "ubuntu'
        const imageTextWithQuoteMatchYaml = textBefore.match(/^\s*image\s*:\s*"([^"]*)$/);

        if (imageTextWithQuoteMatchYaml) {
            const imageText = imageTextWithQuoteMatchYaml[1];
            return yamlSuggestSupport.suggestImages(imageText);
        }

        // Matches strings like: 'image: ubuntu'
        const imageTextWithoutQuoteMatch = textBefore.match(/^\s*image\s*:\s*([\w:/]*)/);

        if (imageTextWithoutQuoteMatch) {
            const imageText = imageTextWithoutQuoteMatch[1];
            return yamlSuggestSupport.suggestImages(imageText);
        }

        return Promise.resolve([]);
    }

    private suggestKeys(word: string, version: string): CompletionItem[] {
        // Attempt to grab the keys for the requested schema version,
        // otherwise, fall back to showing a composition of all possible keys.
        const keys = <KeyInfo>composeVersions[`v${version}`] || composeVersions.all;

        return Object.keys(keys).map(ruleName => {
            const completionItem = new CompletionItem(ruleName);
            completionItem.kind = CompletionItemKind.Keyword;
            completionItem.insertText = ruleName + ': ';
            completionItem.documentation = keys[ruleName];
            return completionItem;
        });
    }
}

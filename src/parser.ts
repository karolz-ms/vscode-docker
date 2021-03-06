/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { TextLine } from 'vscode';

export abstract class Parser {
    public constructor(public readonly tokenParseRegex: RegExp) {
    }

    public keyNameFromKeyToken(keyToken: string): string {
        return keyToken.replace(this.tokenParseRegex, '');
    }

    public tokenValue(line: string, token: IToken): string {
        return line.substring(token.startIndex, token.endIndex);
    }

    public tokensAtColumn(tokens: IToken[], charIndex: number): number[] {
        for (let i = 0, len = tokens.length; i < len; i++) {
            const token = tokens[i];

            if (token.endIndex < charIndex) {
                continue;
            }

            if (token.endIndex === charIndex && i + 1 < len) {
                return [i, i + 1];
            }
            return [i];
        }

        // should not happen: no token found? => return the last one
        return [tokens.length - 1];
    }

    public abstract parseLine(textLine: TextLine): IToken[];
}

export enum TokenType {
    Whitespace,
    Text,
    String,
    Comment,
    Key
}

export interface IToken {
    startIndex: number;
    endIndex: number;
    type: TokenType;
}

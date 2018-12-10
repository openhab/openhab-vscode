import {
	TextDocument,
	Diagnostic,
	DiagnosticSeverity
} from 'vscode-languageserver';

import {
	Settings
} from './Settings'

export function validateTextDocument(textDocument: TextDocument, settings: Settings) {
	// The validator creates diagnostics for all uppercase words length 2 and more
	let text = textDocument.getText();
	let pattern = /\b[A-Z]{2,}\b/g;
	let m: RegExpExecArray | null;

	let problems = 0;
	let diagnostics: Diagnostic[] = [];
	while ((m = pattern.exec(text)) && problems < settings.maxNumberOfProblems) {
		problems++;
		let diagnosic: Diagnostic = {
			severity: DiagnosticSeverity.Warning,
			range: {
				start: textDocument.positionAt(m.index),
				end: textDocument.positionAt(m.index + m[0].length)
			},
			message: `${m[0]} is all uppercase.`,
			source: 'ex'
		};
		diagnosic.relatedInformation = [
			{
				location: {
					uri: textDocument.uri,
					range: Object.assign({}, diagnosic.range)
				},
				message: 'Spelling matters'
			},
			{
				location: {
					uri: textDocument.uri,
					range: Object.assign({}, diagnosic.range)
				},
				message: 'Particularly for names'
			}
		];

		diagnostics.push(diagnosic);
	}

	// Send the computed diagnostics to VSCode.
	return { uri: textDocument.uri, diagnostics };
}
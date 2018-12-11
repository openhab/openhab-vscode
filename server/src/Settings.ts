export interface Settings {
	/**
	 * Controls the maximum number of problems produced by the server.
	 */
	maxNumberOfProblems: number;

	/**
	 * Format current file on save
	 */
	formatOnSave: boolean;

	/**
	 * Host address of REST API
	 */
	host: string;

	/**
	 * Port of REST API
	 */
	port: number;

	/**
	 * Activates item completions from REST API.
	 */
	restCompletions: boolean;

	/**
	 * username if authentication is required
	 */
	username: string;

	/**
	 * password if authentication is required
	 */
	password: string;
}
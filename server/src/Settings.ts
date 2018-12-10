export interface Settings {
	/**
	 * Controls the maximum number of problems produced by the server.
	 */
	maxNumberOfProblems: number;

	/**
	 * Host address of REST API
	 */
	host: String;

	/**
	 * Port of REST API
	 */
	port: number;

	/**
	 * Activates item completions from REST API.
	 */
	restCompletions: boolean;

	username: String;

	password: String;
}
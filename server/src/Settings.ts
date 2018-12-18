/**
 * Interface that represents the client config for openhab extension
 * @author Samuel Brucksch
 */
export interface Settings {
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
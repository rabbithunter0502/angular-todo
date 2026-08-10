/** One entry in the in-app documentation viewer. */
export interface DocEntry {
  /** Stable id, also used in the shareable URL hash (`#/docs/<id>`). */
  readonly id: string;
  readonly title: string;
  readonly description: string;
  /** Path the file is served at (see the extra `assets` entries in `angular.json`). */
  readonly path: string;
}

export interface DocCategory {
  readonly label: string;
  readonly docs: readonly DocEntry[];
}

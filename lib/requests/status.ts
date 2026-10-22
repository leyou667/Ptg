/** Statuts d'une demande. Module sans dépendance serveur : il peut être importé par les composants du navigateur. */
export type RequestStatus = "new" | "in_progress" | "quoted" | "archived";
export const REQUEST_STATUSES: RequestStatus[] = ["new", "in_progress", "quoted", "archived"];

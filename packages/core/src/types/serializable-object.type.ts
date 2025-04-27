export type SerializableObject = {
    [key: string]: string | number | boolean | SerializableObject | SerializableObject[];
};

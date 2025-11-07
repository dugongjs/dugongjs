type Primitive = string | number | boolean;

export type SerializableObject = {
    [key: string]: Primitive | Primitive[] | SerializableObject | SerializableObject[];
};

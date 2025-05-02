export type Adapter = "nestjs-microservices";
export type Transport = "tcp";

export type Context = {
    name: string;
    host: string;
    port: number;
    adapter: Adapter;
    transport: Transport;
};

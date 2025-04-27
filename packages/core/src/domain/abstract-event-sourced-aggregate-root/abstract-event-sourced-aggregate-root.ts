import { AggregateIdAlreadySetError } from "./errors/aggregate-id-already-set.error.js";

export abstract class AbstractEventSourcedAggregateRoot {
    private id: string;
    private isDeletedInternal = false;
    private currentDomainEventSequenceNumber = 0;

    /**
     * Gets the aggregate ID.
     * @returns The aggregate ID.
     */
    public getId(): string {
        return this.id;
    }

    /**
     * Gets the current domain event sequence number.
     * @returns The current domain event sequence number.
     */
    public getCurrentDomainEventSequenceNumber(): number {
        return this.currentDomainEventSequenceNumber;
    }

    /**
     * Checks if the aggregate is deleted.
     * @returns True if the aggregate is deleted, false otherwise.
     */
    public isDeleted(): boolean {
        return this.isDeletedInternal;
    }

    /**
     * Sets the aggregate ID.
     * @param id The aggregate ID to set.
     * @returns The current instance.
     */
    public setId(id: string): this {
        if (this.id) {
            throw new AggregateIdAlreadySetError();
        }
        this.id = id;

        return this;
    }

    /**
     * Sets the current domain event sequence number.
     * @param sequenceNumber The sequence number to set.
     * @returns The current instance.
     */
    public setCurrentDomainEventSequenceNumber(sequenceNumber: number): this {
        this.currentDomainEventSequenceNumber = sequenceNumber;

        return this;
    }

    /**
     * Marks the aggregate as deleted.
     * @returns The current instance.
     */
    public delete(): this {
        this.isDeletedInternal = true;
        return this;
    }
}

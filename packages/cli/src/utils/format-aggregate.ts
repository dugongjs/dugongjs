function formatAggregate(aggregate: any): any {
    if (!aggregate) {
        return null;
    }

    const formattedAggregate = Object.assign({}, aggregate);

    delete formattedAggregate["id"];
    delete formattedAggregate["stagedEvents"];
    delete formattedAggregate["isDeletedInternal"];
    delete formattedAggregate["currentDomainEventSequenceNumber"];

    return formattedAggregate;
}

export default formatAggregate;

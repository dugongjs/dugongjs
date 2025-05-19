---
title: "Part 10 - Testing Transactionality (Kafka)"
sidebar_position: 11
---

![DugongJS + NestJS](/img/dugongjs_nestjs.png)

In [part 8](part_8.md) we tested the system's transactionality using the in-memory message broker. We observed that when an error was thrown during a command, the entire transaction — including message publishing — was rolled back. In this part, we’ll revisit that test after switching to Kafka.

### Simulating a Transaction Failure

[As in part 8](part_8.md#simulating-a-transaction-failure), modify the `closeAccount()` method in `BankAccountCommandService` to throw an error after applying and committing the domain event:

```typescript title="src/bank-account/application/command/bank-account.command.service.ts"
class BankAccountCommandService {
    // Rest of class...

    public async closeAccount(accountId: string): Promise<BankAccount> {
        return this.eventSourcingService.transaction(async (transaction) => {
            const accountContext = this.eventSourcingService.createAggregateContext(transaction, BankAccount);

            const account = await accountContext.build(accountId);

            if (!account) {
                throw new Error(`BankAccount with ID ${accountId} not found.`);
            }

            account.closeAccount();

            await accountContext.applyAndCommitStagedDomainEvents(account);

            // highlight-next-line
            throw new Error("An unexpected error occurred while closing the account.");

            return account;
        });
    }
}
```

Restart the application to apply the changes.

### Testing the Behavior

Now, manually test the failure scenario:

1. Open a new bank account using a POST request.
2. Attempt to close the account — this should throw an error.

Then open Kafka UI, navigate to the topic for the BankAccount aggregate, and inspect the messages.

You should now **see a message containing the `AccountClosed` event, even though an error was thrown in the service**. Next, inspect the aggregate using Dugong Studio. It **should not show the `AccountClosed` event in the event log**.

This discrepancy reveals a critical issue: after switching from the in-memory message broker to Kafka, **we have lost transactionality**.

### Consequences

Take a moment to think about the severity of this issue.

An error occurred during the transaction, but the domain event was still published to the message broker. Any downstream consumers — including microservices maintaining read models based on the event stream — will perceive the `AccountClosed` event as valid and react to it.

This can happen sporadically due to a variety of reasons, including:

- A bug in our code.
- Concurrency issues.
- Network issues.
- Database failures.
- Application crashing due to updates or resource constraints.

And many more...

If left unresolved, the system will eventually enter an inconsistent state. Aggregates will diverge, query models will no longer reflect real domain state, and debugging such issues will become incredibly difficult.

To achieve reliable system behavior, **we need a way to guarantee transactionality**.

:::info
If you performed a query after triggering the error, you might have been surprised to see that the query model was still in sync with the command side — meaning the model was not deleted, even though an `AccountClosed` event had been published to Kafka.

This might seem like the system maintained transactionality — but in fact, it didn’t. The reason the query model remains consistent is because the consumer rebuilds the aggregate from the event log before deciding whether to update or delete the model. Since the event log wasn’t updated (due to the transaction being rolled back), the `AccountClosed` event wasn’t applied to the aggregate.

In other words, this is a coincidence, not a guarantee. The message was still published, and any consumers not reconstructing aggregates from the event log (e.g., projections built purely from message payloads) could have reacted incorrectly.
:::

import { Apply, type AbstractConstructor } from "@dugongjs/core";
import { AccountClosedEvent } from "./domain-events/account-closed.event.js";
import { AccountOpenedEvent } from "./domain-events/account-opened.event.js";
import { MoneyDepositedEvent } from "./domain-events/monet-deposited.event.js";
import { MoneyWithdrawnEvent } from "./domain-events/monet-withdrawn.event.js";

export function WithAccountKernel<TBase extends AbstractConstructor<{ delete: () => void }>>(Base: TBase) {
    abstract class AccountKernel extends Base {
        public _owner: string;
        public _balance: number;

        public getOwner(): string {
            return this._owner;
        }

        public getBalance(): number {
            return this._balance;
        }

        @Apply(AccountOpenedEvent)
        public applyAccountOpened(event: AccountOpenedEvent): void {
            const payload = event.getPayload();

            this._owner = payload.owner;
            this._balance = payload.initialAmount;
        }

        @Apply(MoneyDepositedEvent)
        public applyMoneyDeposited(event: MoneyDepositedEvent): void {
            const payload = event.getPayload();

            this._balance += payload.amount;
        }

        @Apply(MoneyWithdrawnEvent)
        public applyMoneyWithdrawn(event: MoneyWithdrawnEvent): void {
            const payload = event.getPayload();

            this._balance -= payload.amount;
        }

        @Apply(AccountClosedEvent)
        public applyAccountClosed(): void {
            this.delete();
        }
    }

    return AccountKernel;
}

import { createAction } from '@bigcommerce/data-store';
import { createRequestSender } from '@bigcommerce/request-sender';
import { Observable } from 'rxjs';

import { createCheckoutClient, createCheckoutStore, CheckoutRequestSender, CheckoutStore, CheckoutValidator } from '../../checkout';
import { OrderActionCreator, OrderActionType, SubmitOrderAction } from '../../order';
import { getOrderRequestBody } from '../../order/internal-orders.mock';

import OfflinePaymentStrategy from './offline-payment-strategy';

describe('OfflinePaymentStrategy', () => {
    let orderActionCreator: OrderActionCreator;
    let store: CheckoutStore;
    let strategy: OfflinePaymentStrategy;
    let submitOrderAction: Observable<SubmitOrderAction>;

    beforeEach(() => {
        store = createCheckoutStore();
        orderActionCreator = new OrderActionCreator(
            createCheckoutClient(createRequestSender()),
            new CheckoutValidator(new CheckoutRequestSender(createRequestSender()))
        );
        submitOrderAction = Observable.of(createAction(OrderActionType.SubmitOrderRequested));

        jest.spyOn(orderActionCreator, 'submitOrder')
            .mockReturnValue(submitOrderAction);

        jest.spyOn(store, 'dispatch');

        strategy = new OfflinePaymentStrategy(store, orderActionCreator);
    });

    it('submits order without payment data', async () => {
        await strategy.execute(getOrderRequestBody());

        expect(orderActionCreator.submitOrder).toHaveBeenCalledWith({
            ...getOrderRequestBody(),
            payment: {
                methodId: 'authorizenet',
            },
        }, undefined);

        expect(store.dispatch).toHaveBeenCalledWith(submitOrderAction);
    });

    it('returns checkout state', async () => {
        const output = await strategy.execute(getOrderRequestBody());

        expect(output).toEqual(store.getState());
    });
});
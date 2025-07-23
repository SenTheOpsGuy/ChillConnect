import paypal from '@paypal/checkout-server-sdk';
import { logger } from '../utils/logger';

// PayPal environment setup
const environment = process.env.NODE_ENV === 'production' 
  ? new paypal.core.LiveEnvironment(
      process.env.PAYPAL_CLIENT_ID!,
      process.env.PAYPAL_CLIENT_SECRET!
    )
  : new paypal.core.SandboxEnvironment(
      process.env.PAYPAL_CLIENT_ID!,
      process.env.PAYPAL_CLIENT_SECRET!
    );

const client = new paypal.core.PayPalHttpClient(environment);

export const createPayPalOrder = async (amount: number, currency: string = 'INR') => {
  try {
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: currency,
          value: amount.toString()
        },
        description: 'Token purchase for Booking Platform'
      }],
      application_context: {
        return_url: `${process.env.CLIENT_URL}/payment/success`,
        cancel_url: `${process.env.CLIENT_URL}/payment/cancel`,
        brand_name: 'Booking Platform',
        user_action: 'PAY_NOW'
      }
    });

    const order = await client.execute(request);
    
    const approvalUrl = order.result.links?.find(
      (link: any) => link.rel === 'approve'
    )?.href;

    logger.info(`PayPal order created: ${order.result.id}`);

    return {
      success: true,
      orderId: order.result.id,
      approvalUrl,
      order: order.result
    };
  } catch (error) {
    logger.error('PayPal order creation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const capturePayPalOrder = async (orderId: string) => {
  try {
    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});

    const capture = await client.execute(request);
    
    const captureId = capture.result.purchase_units[0].payments.captures[0].id;
    const amount = capture.result.purchase_units[0].payments.captures[0].amount.value;
    const currency = capture.result.purchase_units[0].payments.captures[0].amount.currency_code;

    logger.info(`PayPal payment captured: ${captureId} for ${amount} ${currency}`);

    return {
      success: true,
      captureId,
      amount,
      currency,
      capture: capture.result
    };
  } catch (error) {
    logger.error('PayPal capture failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const refundPayPalPayment = async (captureId: string, amount?: number) => {
  try {
    const request = new paypal.payments.CapturesRefundRequest(captureId);
    
    if (amount) {
      request.requestBody({
        amount: {
          value: amount.toString(),
          currency_code: 'INR'
        }
      });
    }

    const refund = await client.execute(request);
    
    logger.info(`PayPal refund processed: ${refund.result.id}`);

    return {
      success: true,
      refundId: refund.result.id,
      refund: refund.result
    };
  } catch (error) {
    logger.error('PayPal refund failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
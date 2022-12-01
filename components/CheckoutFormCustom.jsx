import React from "react";
import {
  CardNumberElement,
  CardCvcElement,
  CardExpiryElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

export default function CheckoutFormCustom({ clientSecret: secret }) {
  console.log()
  const stripe = useStripe();
  const elements = useElements();

  const [message, setMessage] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (!stripe) {
      return;
    }

    const clientSecret = new URLSearchParams(window.location.search).get(
      "payment_intent_client_secret"
    );

    if (!clientSecret) {
      return;
    }

    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      switch (paymentIntent.status) {
        case "succeeded":
          setMessage("Payment succeeded!");
          break;
        case "processing":
          setMessage("Your payment is processing.");
          break;
        case "requires_payment_method":
          setMessage("Your payment was not successful, please try again.");
          break;
        default:
          setMessage("Something went wrong.");
          break;
      }
    });
  }, [stripe]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    setIsLoading(true);

    // const cardElement = elements.getElement(CardNumberElement);
    const cardElement = elements.getElement('cardNumber');

    const paymentMethodReq = await stripe.createPaymentMethod({
      type: "card",
      card: cardElement,
      billing_details: {
        name: "John",
        email: "john@example.com",
        address: {
          // city: "New York",
          // line1: "896 Bell Street",
          // state: "New York",
          postal_code: "10022"
        }
      }
    });

    if (paymentMethodReq.error) {
      setMessage(paymentMethodReq.error.message);
      setIsLoading(false);
      return;
    }

    const { paymentIntent, error } = await stripe.confirmCardPayment(
      secret,
      {
        payment_method: paymentMethodReq.paymentMethod.id,
        return_url: "http://localhost:3000/success",
      },
      {
        handleActions: false,
      }
    );
    console.log('paymentIntent, error', paymentIntent, error)

    if (error) {
      if (error.type === "card_error" || error.type === "validation_error") {
        setMessage(error.message);
      } else {
        setMessage("An unexpected error occurred.");
      }
    }

    setIsLoading(false);
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit}>
      {/* <label>Email</label><br />
      <input type={'email'} /><br /> */}
      <label>Card number</label><br />
      <CardNumberElement options={{ showIcon: true }} />
      <label>Exp. date</label><br />
      <CardExpiryElement />
      <label>CVC</label><br />
      <CardCvcElement />
      <button disabled={isLoading || !stripe || !elements} id="submit">
        <span id="button-text">
          {isLoading ? <div className="spinner" id="spinner"></div> : "Pay now"}
        </span>
      </button>
      {/* Show any error or success messages */}
      {message && <div id="payment-message">{message}</div>}
    </form>
  );
}
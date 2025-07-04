/* eslint-disable @typescript-eslint/no-unused-vars */

class SendEmail {
  constructor() {
    console.log('Send Email On Fire...');
  }
}

/**
 * Tight coupling means components rely heavily on each other,
 * while loose coupling means components have minimal dependencies
 */

class User {
  // loosely coupled relationship  === Dependecy Injection
  private _sendEmail: SendEmail;
  constructor(sendEmail: SendEmail) {
    this._sendEmail = sendEmail;
  }
}

class Producte {
  // loosely coupled relationship === Dependecy Injection
  constructor(private _sendEmail: SendEmail) {}
}

class Order {
  // tightly coupled relationship
  sendEmail = new SendEmail();
}

class Reviews {
  // tightly coupled relationship
  sendEmail = new SendEmail();
}

// one SendEmail instance in the DI Container (globaly in our app)
const sendEmail = new SendEmail();

const user = new User(sendEmail);
const product = new Producte(sendEmail);

const order = new Order(); // SendEmail new instance
const reviews = new Reviews(); // SendEmail new instance

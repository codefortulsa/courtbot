var proxyquire = require("proxyquire");

describe("registration routes", () => {
  var twilioFake;
  var registrationsFake;
  var testee;
  beforeEach(() => {
    twilioFake = {
      TwimlResponse: function () {}
    };
    registrationsFake = {
      registrationState: {
        UNBOUND: 0,
        ASKED_PARTY: 1,
        ASKED_REMINDER: 2,
        REMINDING: 3,
        UNSUBSCRIBED: 4
      },
      getRegistrationsForUser: function() {},
      getRegistrations:  function() {},
      unsubscribeRegistration: function() {},
      unsubscribeAll: function() {},
      selectParty: function() {},
      confirmReminders: function() {},
      beginRegistration: function() {}
    };

    testee = proxyquire.noCallThru().load("../../sms/registerRoutes", {
      "twilio": twilioFake,
      "../data/registrations": registrationsFake
    });
  });

  describe("when user has an registration in the REMINDING state", () => {
    beforeEach(() => {
      spyOn(registrationsFake, "getRegistrationsForUser").and.callFake(u => {
        return Promise.resolve([
          {
            state: 3
          }
        ]);
      });
      spyOn(registrationsFake, "unsubscribeAll").and.callFake(s => {
        return Promise.resolve();
      });
    })
    it("sets the REMINDING record to UNSUBSCRIBED if the user enters CANCEL", cb => {
      testee({
        body: {
          Body: "CANCEL",
          From: "1234567890"
        }
      }, { writeHead: function() {}, end: function() {}})
      .then(x => {
        expect(registrationsFake.getRegistrationsForUser).toHaveBeenCalledWith("1234567890");
        expect(registrationsFake.unsubscribeAll).toHaveBeenCalledWith();
      })
      .then(cb);
    });
    it("sets the REMINDING record to UNSUBSCRIBED if the user enters UNSUBSCRIBE", cb => {
      testee({
        body: {
          Body: "UNSUBSCRIBE",
          From: "1234567890"
        }
      }, { writeHead: function() {}, end: function() {}})
      .then(x => {
        expect(registrationsFake.getRegistrationsForUser).toHaveBeenCalledWith("1234567890");
        expect(registrationsFake.unsubscribeAll).toHaveBeenCalledWith();
      })
      .then(cb);
    });
  });
  describe("when a user has an pending registration in the ASKED_PARTY state", () => {
    beforeEach(() => {
      spyOn(registrationsFake, "getRegistrationsForUser").and.callFake(u => {
        return Promise.resolve([
          {
            registration_id: 123,
            state: 1
          }
        ]);
      });
      spyOn(registrationsFake, "unsubscribeRegistration").and.callFake(s => {
        return Promise.resolve();
      });
      spyOn(registrationsFake, "selectParty").and.callFake(() => Promise.resolve());
    })
    it("selects the party that was passed in", cb => {
      testee({
        body: {
          Body: "2",
          From: "1234567890"
        }
      }, { writeHead: function() {}, end: function() {}})
      .then(() => {
        expect(registrationsFake.getRegistrationsForUser).toHaveBeenCalledWith("1234567890");
        expect(registrationsFake.selectParty).toHaveBeenCalledWith("2");
      })
      .then(cb);
    });
    it("sets the pending record to UNSUBSCRIBED if the user enters CANCEL", cb => {
      testee({
        body: {
          Body: "CANCEL",
          From: "1234567890"
        }
      }, { writeHead: function() {}, end: function() {}})
      .then(x => {
        expect(registrationsFake.getRegistrationsForUser).toHaveBeenCalledWith("1234567890");
        expect(registrationsFake.unsubscribeRegistration).toHaveBeenCalledWith(123);
      })
      .then(cb);
    });
    it("sets the pending record to UNSUBSCRIBED if the user enters UNSUBSCRIBE", cb => {
      testee({
        body: {
          Body: "UNSUBSCRIBE",
          From: "1234567890"
        }
      }, { writeHead: function() {}, end: function() {}})
      .then(x => {
        expect(registrationsFake.getRegistrationsForUser).toHaveBeenCalledWith("1234567890");
        expect(registrationsFake.unsubscribeRegistration).toHaveBeenCalledWith(123);
      })
      .then(cb);
    });
  });

  describe("when user has an pending registration in the ASKED_REMINDER state", () => {
    beforeEach(() => {
      spyOn(registrationsFake, "getRegistrationsForUser").and.callFake(u => {
        return Promise.resolve([
          {
            registration_id: 1234,
            state: 2
          }
        ]);
      });
      spyOn(registrationsFake, "unsubscribeRegistration").and.callFake(() => Promise.resolve());
      spyOn(registrationsFake, "confirmReminders").and.callFake(() => Promise.resolve());
    })
    it("sets the pending record to REMINDING if the user enters YES", cb => {
      testee({
        body: {
          Body: "YES",
          From: "1234567890"
        }
      }, { writeHead: function() {}, end: function() {}})
      .then(() => {
        expect(registrationsFake.getRegistrationsForUser).toHaveBeenCalledWith("1234567890");
        expect(registrationsFake.confirmReminders).toHaveBeenCalledWith("1234567890", true, jasmine.any(Object));
      })
      .then(cb);
    });
    it("sets the pending record to UNSUBSCRIBED if the user enters NO", cb => {
      testee({
        body: {
          Body: "NO",
          From: "1234567890"
        }
      }, { writeHead: function() {}, end: function() {}})
      .then(() => {
        expect(registrationsFake.getRegistrationsForUser).toHaveBeenCalledWith("1234567890");
        expect(registrationsFake.confirmReminders).toHaveBeenCalledWith("1234567890", false, jasmine.any(Object))
      })
      .then(cb);
    });
    it("sets the pending record to UNSUBSCRIBED if the user enters CANCEL", cb => {
      testee({
        body: {
          Body: "CANCEL",
          From: "1234567890"
        }
      }, { writeHead: function() {}, end: function() {}})
      .then(x => {
        expect(registrationsFake.getRegistrationsForUser).toHaveBeenCalledWith("1234567890");
        expect(registrationsFake.unsubscribeRegistration).toHaveBeenCalledWith(1234);
      })
      .then(cb);
    });
    it("sets the pending record to UNSUBSCRIBED if the user enters UNSUBSCRIBE", cb => {
      testee({
        body: {
          Body: "UNSUBSCRIBE",
          From: "1234567890"
        }
      }, { writeHead: function() {}, end: function() {}})
      .then(x => {
        expect(registrationsFake.getRegistrationsForUser).toHaveBeenCalledWith("1234567890");
        expect(registrationsFake.unsubscribeRegistration).toHaveBeenCalledWith(1234);
      })
      .then(cb);
    });
  });

  describe("when user has no pending registrations", () => {
    beforeEach(() => {
      spyOn(registrationsFake, "getRegistrationsForUser").and.callFake(u => Promise.resolve([]));
      spyOn(registrationsFake, "beginRegistration").and.callFake(u => Promise.resolve());
    })

    describe("and a case number is sent", () => {
      it("begins a new registration", cb => {
        testee({
          body: {
            Body: "TEST-NUMBER",
            From: "1234567890"
          }
        }, { writeHead: function() {}, end: function() {}})
        .then(x => {
          expect(registrationsFake.getRegistrationsForUser).toHaveBeenCalledWith("1234567890");
          expect(registrationsFake.beginRegistration).toHaveBeenCalledWith("TEST-NUMBER", "1234567890", jasmine.any(Object));
        })
        .then(cb);
      });
    });

  });
});

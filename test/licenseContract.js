// Test framework extension to detect solidity throws easily

Promise.prototype.thenSolidityThrow = function(description) {
  if (typeof description === 'undefined') {
    description = "Expected to throw";
  }
  return this.then(function() {
    assert(false, description);
  }).catch(function(error) {
    var invalidOpcode = error.toString().indexOf("VM Exception while processing transaction: invalid opcode") != -1;
    var revert = error.toString().indexOf("VM Exception while processing transaction: revert") != -1;
    assert(invalidOpcode || revert, "Solidity should throw (calling an invalid opcode or revert), got error: " + error.toString());
  });
};

Promise.prototype.thenBalance = function(issuanceNumber, account, balance) {
  return this.then(function() {
    return LicenseContract.deployed();
  }).then(function(instance) {
    return instance.balance(issuanceNumber, account);
  }).then(function(actualBalance) {
    assert.equal(actualBalance.valueOf(), balance)
  })
};

Promise.prototype.thenTemporaryBalance = function(issuanceNumber, account, balance) {
  return this.then(function() {
    return LicenseContract.deployed();
  }).then(function(instance) {
    return instance.temporaryBalance(issuanceNumber, account);
  }).then(function(actualBalance) {
    assert.equal(actualBalance.valueOf(), balance)
  });
};

Promise.prototype.thenTemporaryBalanceReclaimableBy = function(issuanceNumber, account, reclaimer, balance) {
  return this.then(function() {
    return LicenseContract.deployed();
  }).then(function(instance) {
    return instance.temporaryBalanceReclaimableBy(issuanceNumber, account, reclaimer);
  }).then(function(actualBalance) {
    assert.equal(actualBalance.valueOf(), balance)
  });
};

Promise.prototype.thenRelevantIssuances = function(owner, expectedRelevantissuanceNumbers) {
  var licenseContract;
  var temp = this;
  
  temp = temp.then(function() {
    return LicenseContract.deployed();
  }).then(function(instance) {
    licenseContract = instance;
  });


  temp = temp.then(function() {
    return licenseContract.relevantIssuancesCount(owner);
  }).then(function(count) {
    assert.equal(count, expectedRelevantissuanceNumbers.length);
  });

  for (var i = 0; i < expectedRelevantissuanceNumbers.length; i++) {
    var j = i;
    temp = temp.then(function() {
      return licenseContract.relevantIssuances(owner, j);
    }).then(function(issuanceNumber) {
      assert.equal(issuanceNumber, expectedRelevantissuanceNumbers[j], "relevantIssuances[" + j + "]");
    })
  }
  return temp;
};

Promise.prototype.thenTemporaryLicenseHolders = function(issuanceNumber, originalOwner, expectedTemporaryLicenseHolders) {
  var licenseContract;
  var temp = this;
  
  temp = temp.then(function() {
    return LicenseContract.deployed();
  }).then(function(instance) {
    licenseContract = instance;
  });


  temp = temp.then(function() {
    return licenseContract.temporaryLicenseHoldersCount(issuanceNumber, originalOwner);
  }).then(function(count) {
    assert.equal(count, expectedTemporaryLicenseHolders.length);
  });

  for (var i = 0; i < expectedTemporaryLicenseHolders.length; i++) {
    var j = i;
    temp = temp.then(function() {
      return licenseContract.temporaryLicenseHolders(issuanceNumber, originalOwner, j);
    }).then(function(issuanceNumber) {
      assert.equal(issuanceNumber, expectedTemporaryLicenseHolders[j], "temporaryLicenseHolders[" + j + "]");
    })
  }
  return temp;
};

assert.transactionCost = function(transaction, expectedCost, methodName) {
  assert.isAtMost(transaction.receipt.gasUsed, expectedCost + 64, "Regression in gas usage for " + methodName + " by " + (transaction.receipt.gasUsed - expectedCost) + " gas");
  assert.isAtLeast(transaction.receipt.gasUsed, expectedCost - 64, "🎉 Improvement in gas usage for " + methodName + " by " + (expectedCost - transaction.receipt.gasUsed) + " gas");
};

class Issuance {
  constructor(array) {
    this.description = array[0];
    this.code = array[1];
    this.originalSupply = array[2];
    this.auditTime = array[3];
    this.auditRemark = array[4];
    this.revoked = array[5];
    this.revocationReason = array[6];
    this.balance = array[7];
    this.temporaryBalance = array[8];
    this.temporaryLicenseHolders = array[9];
  }
}

var LicenseContract = artifacts.require("./LicenseContract.sol");

contract("LicenseContract constructor", function(accounts) {
  accounts = require("../accounts.js")(accounts);

  it("should set the issuer's address", function() {
    return LicenseContract.deployed().then(function(instance) {
      return instance.issuer();
    }).then(function(address) {
      assert.equal(address.valueOf(), accounts.issuer);
    });
  });

  it("should set the issuer's name", function() {
    return LicenseContract.deployed().then(function(instance) {
      return instance.issuerName();
    }).then(function(name) {
      assert.equal(name.valueOf(), "Soft&Cloud");
    });
  });

  it("should set the issuer's certificate", function() {
    return LicenseContract.deployed().then(function(instance) {
      return instance.issuerSSLCertificate();
    }).then(function(certificate) {
      assert.equal(certificate.valueOf(), '0x0ce8');
    });
  });

  it("should set the liability", function() {
    return LicenseContract.deployed().then(function(instance) {
      return instance.liability();
    }).then(function(liability) {
      assert.equal(liability.valueOf(), "We are not liable for anything!");
    });
  });

  it("should set the safekeeping period", function() {
    return LicenseContract.deployed().then(function(instance) {
      return instance.safekeepingPeriod();
    }).then(function(safekeepingPeriod) {
      assert.equal(safekeepingPeriod.valueOf(), 10);
    });
  });

  it("should set the issuance fee", function() {
    return LicenseContract.deployed().then(function(instance) {
      return instance.issuanceFee();
    }).then(function(issuanceFee) {
      assert.equal(issuanceFee.valueOf(), 500/*wei*/);
    });
  });

  it("should set the LOB root to the sender's address", function() {
    return LicenseContract.deployed().then(function(instance) {
      return instance.lobRoot();
    }).then(function(rootAddress) {
      assert.equal(rootAddress.valueOf(), accounts.lobRoot);
    });
  });

  it("does not disable the license contract", function() {
    return LicenseContract.deployed().then(function(instance) {
      return instance.disabled();
    }).then(function(disabled) {
      assert.equal(disabled.valueOf(), false);
    });
  });

  it("should set the manager address to 0x0", function() {
    return LicenseContract.deployed().then(function(instance) {
      return instance.managerAddress();
    }).then(function(managerAddress) {
      assert.equal(managerAddress.valueOf(), '0x0000000000000000000000000000000000000000');
    });
  });
});

contract("License contract signature", function(accounts) {
  accounts = require("../accounts.js")(accounts);

  it("cannot be set from anyone but the issuer", function() {
    return LicenseContract.deployed().then(function(instance) {
      return instance.sign("0x051381", {from: accounts.firstOwner});
    })
    .thenSolidityThrow();
  });

  it("should be saved when contract is signed", function() {
    var licenseContract;
    return LicenseContract.deployed().then(function(instance) {
      licenseContract = instance;
      return licenseContract.sign("0x051381", {from: accounts.issuer});
    }).then(function() {
      return licenseContract.signature();
    }).then(function(signature) {
      assert.equal(signature.valueOf(), "0x051381");
    });
  });

  it("cannot be changed once set", function() {
    return LicenseContract.deployed().then(function(instance) {
      return instance.sign("0x051381", {from: accounts.issuer});
    })
    .thenSolidityThrow();
  });
})

contract("License issuing", function(accounts) {
  accounts = require("../accounts.js")(accounts);

  it("cannot be done if the license contract has not been signed", function() {
    var licenseContract;
    return LicenseContract.deployed().then(function(instance) {
      licenseContract = instance;
      return licenseContract.issueLicense("Desc", "ID", accounts.firstOwner, 70, "Remark", 1509552789, {from:accounts.issuer, value: 500});
    })
    .thenSolidityThrow()
    .then(function() {
      return licenseContract.sign("0x051381", {from: accounts.issuer});
    });
  });

  it("cannot be performed by an address that is not the issuer", function() {
    return LicenseContract.deployed().then(function(instance) {
      return instance.issueLicense("Desc", "ID", accounts.firstOwner, 70, "Remark", 1509552789, {from:accounts.secondOwner, value: 500});
    }).thenSolidityThrow();
  });

  it("cannot be performed by the LOB root", function() {
    return LicenseContract.deployed().then(function(instance) {
      return instance.issueLicense("Desc", "ID", accounts.firstOwner, 70, "Remark", 1509552789, {from:accounts.lobRoot, value: 500});
    }).thenSolidityThrow();
  });

  it("cannot be performed by the LOB root owner", function() {
    return LicenseContract.deployed().then(function(instance) {
      return instance.issueLicense("Desc", "ID", accounts.firstOwner, 70, "Remark", 1509552789, {from:accounts.lobRootOwner, value: 500});
    }).thenSolidityThrow();
  });

  it("cannot be performed if the issuance fee is not transmitted", function() {
    return LicenseContract.deployed().then(function(instance) {
      return instance.issueLicense("Desc", "ID", accounts.firstOwner, 70, "Remark", 1509552789, {from:accounts.issuer, value: 10});
    }).thenSolidityThrow();
  });

  it("works if called by the issuer and exactly the right issuance fee is transmitted", function() {
    var licenseContract;
    return LicenseContract.deployed().then(function(instance) {
      licenseContract = instance;
      return licenseContract.issueLicense("Desc", "ID", accounts.firstOwner, 70, "Remark", 1509552789, {from:accounts.issuer, value: 500});
    }).then(function(transaction) {
      assert.transactionCost(transaction, 207646, "license issuing");
    }).then(function() {
      return licenseContract.issuancesCount();
    }).then(function(issuancesCount) {
      assert.equal(issuancesCount.valueOf(), 1);
    }).thenRelevantIssuances(accounts.firstOwner, [0]);
  });

  
  it("sets the description", function() {
    return LicenseContract.deployed().then(function(instance) {
      return instance.issuances(0); 
    }).then(function(issuance) {
      assert.equal(new Issuance(issuance).description, "Desc");
    });
  });

  it("sets the code", function() {
    return LicenseContract.deployed().then(function(instance) {
      return instance.issuances(0); 
    }).then(function(issuance) {
      assert.equal(new Issuance(issuance).code, "ID");
    });
  });

  it("sets the original supply", function() {
    return LicenseContract.deployed().then(function(instance) {
      return instance.issuances(0);
    }).then(function(issuance) {
      assert.equal(new Issuance(issuance).originalSupply, 70);
    });
  });

  it("sets the audit time", function() {
    return LicenseContract.deployed().then(function(instance) {
      return instance.issuances(0); 
    }).then(function(issuance) {
      assert.equal(new Issuance(issuance).auditTime, 1509552789);
    });
  });

  it("sets the audit remark", function() {
    return LicenseContract.deployed().then(function(instance) {
      return instance.issuances(0); 
    }).then(function(issuance) {
      assert.equal(new Issuance(issuance).auditRemark, "Remark");
    });
  });

  it("sets revoked to false", function() {
    return LicenseContract.deployed().then(function(instance) {
      return instance.issuances(0); 
    }).then(function(issuance) {
      assert.equal(new Issuance(issuance).revoked, false);
    });
  });

  it("initially assigns all licenses to the initial owner", function() {
    var licenseContract;
    return LicenseContract.deployed().then(function(instance) {
      licenseContract = instance;
      return licenseContract.issueLicense("Desc", "ID", accounts.firstOwner, 70, "Remark", 1509552789, {from:accounts.issuer, value: 500});
    })
    .thenBalance(0, accounts.firstOwner, 70);
  });
});

contract("License transfer", function(accounts) {
  accounts = require("../accounts.js")(accounts);

  before(function() {
    var licenseContract;
    LicenseContract.deployed().then(function(instance) {
      licenseContract = instance;
      return licenseContract.sign("0x051381", {from: accounts.issuer});
    }).then(function() {
      return licenseContract.issueLicense("Desc", "ID", accounts.firstOwner, 70, "Remark", 1509552789, {from:accounts.issuer, value: 500});
    });
  });

  it("does not work if the sender's address doesn't own any licenses", function() {
    return LicenseContract.deployed().then(function(instance) {
      return instance.transfer(0, accounts.thirdOwner, 5, {from:accounts.secondOwner});
    })
    .thenSolidityThrow();
  });

  it("does not work if the sender's address doesn't own enough licenses", function() {
    return LicenseContract.deployed().then(function(instance) {
      return instance.transfer(0, accounts.thirdOwner, 75, {from:accounts.secondOwner});
    })
    .thenSolidityThrow();
  });

  it("can transfer less licenses than currently owned by the sender", function() {
    var licenseContract;
    return LicenseContract.deployed().then(function(instance) {
      licenseContract = instance;
      return licenseContract.transfer(0, accounts.secondOwner, 20, {from:accounts.firstOwner});
    })
    .then(function(transaction) {
      assert.transactionCost(transaction, 79000, "transfer");
    })
    .thenBalance(0, accounts.firstOwner, 50)
    .thenBalance(0, accounts.secondOwner, 20)
    .thenRelevantIssuances(accounts.secondOwner, [0]);
  });

  it("can transfer licenses from the second owner to a third owner", function() {
    var licenseContract;
    return LicenseContract.deployed().then(function(instance) {
      licenseContract = instance;
      return licenseContract.transfer(0, accounts.thirdOwner, 15, {from:accounts.secondOwner});
    })
    .thenBalance(0, accounts.firstOwner, 50)
    .thenBalance(0, accounts.secondOwner, 5)
    .thenBalance(0, accounts.thirdOwner, 15)
    .thenRelevantIssuances(accounts.thirdOwner, [0]);
  });

  it("cannot transfer licenses twice", function() {
    return LicenseContract.deployed().then(function(instance) {
      return instance.transfer(0, accounts.thirdOwner, 7, {from:accounts.secondOwner});
    })
    .thenSolidityThrow();
  });

  it("cannot transfer more licenses than currently owned", function() {
    return LicenseContract.deployed().then(function(instance) {
      return instance.transfer(0, accounts.thirdOwner, 7, {from:accounts.secondOwner});
    })
    .thenSolidityThrow();
  });

  it("can transfer licenses to from one user to himself", function() {
    return LicenseContract.deployed().then(function(instance) {
      return instance.transfer(0, accounts.secondOwner, 5, {from:accounts.secondOwner});
    })
    .thenBalance(0, accounts.firstOwner, 50)
    .thenBalance(0, accounts.secondOwner, 5)
    .thenBalance(0, accounts.thirdOwner, 15)
    .thenRelevantIssuances(accounts.secondOwner, [0, 0]);
  });

  it("can transfer 0 licenses", function() {
    return LicenseContract.deployed().then(function(instance) {
      return instance.transfer(0, accounts.fourthOwner, 0, {from:accounts.fourthOwner});
    })
    .thenBalance(0, accounts.firstOwner, 50)
    .thenBalance(0, accounts.secondOwner, 5)
    .thenBalance(0, accounts.thirdOwner, 15)
    .thenBalance(0, accounts.fourthOwner, 0);
  });

  it("can transfer licenses back to the previous owner", function() {
    return LicenseContract.deployed().then(function(instance) {
      return instance.transfer(0, accounts.secondOwner, 15, {from:accounts.thirdOwner});
    })
    .thenBalance(0, accounts.firstOwner, 50)
    .thenBalance(0, accounts.secondOwner, 20)
    .thenBalance(0, accounts.thirdOwner, 0)
    .thenRelevantIssuances(accounts.secondOwner, [0, 0, 0]);
  });
});

contract("Temporary license transfer", function(accounts) {
  accounts = require("../accounts.js")(accounts);

  before(function() {
    var licenseContract;
    return LicenseContract.deployed().then(function(instance) {
      licenseContract = instance;
      return licenseContract.sign("0x051381", {from: accounts.issuer});
    }).then(function() {
      return licenseContract.issueLicense("Desc", "ID", accounts.firstOwner, 70, "Remark", 1509552789, {from:accounts.issuer, value: 500});
    });
  });

  it("results in correct balances for both sides", function() {
    var licenseContract;
    return LicenseContract.deployed()
    .then(function(instance) {
      licenseContract = instance;
      return licenseContract.transferTemporarily(0, accounts.secondOwner, 20, {from: accounts.firstOwner});
    })
    .then(function(transaction) {
      assert.transactionCost(transaction, 140709, "transferTemporarily");
    })
    .thenBalance(0, accounts.firstOwner, 50)
    .thenBalance(0, accounts.secondOwner, 20)
    .thenTemporaryBalance(0, accounts.firstOwner, 0)
    .thenTemporaryBalance(0, accounts.secondOwner, 20)
    .thenTemporaryBalanceReclaimableBy(0, accounts.firstOwner, accounts.firstOwner, 50)
    .thenTemporaryBalanceReclaimableBy(0, accounts.firstOwner, accounts.secondOwner, 0)
    .thenTemporaryBalanceReclaimableBy(0, accounts.secondOwner, accounts.firstOwner, 20)
    .thenTemporaryBalanceReclaimableBy(0, accounts.secondOwner, accounts.secondOwner, 0)
    .thenRelevantIssuances(accounts.firstOwner, [0])
    .thenRelevantIssuances(accounts.secondOwner, [0])
    .thenTemporaryLicenseHolders(0, accounts.firstOwner, [accounts.secondOwner])
    .thenTemporaryLicenseHolders(0, accounts.secondOwner, [])
  });

  it("allows the sender to reclaim the licenses in one piece", function() {
    return LicenseContract.deployed().then(function(instance) {
      return instance.reclaim(0, accounts.secondOwner, 20, {from: accounts.firstOwner});
    })
    .then(function(transaction) {
      assert.transactionCost(transaction, 22943, "reclaim");
    })
    .thenBalance(0, accounts.firstOwner, 70)
    .thenBalance(0, accounts.secondOwner, 0)
    .thenTemporaryBalance(0, accounts.firstOwner, 0)
    .thenTemporaryBalance(0, accounts.secondOwner, 0)
    .thenTemporaryBalanceReclaimableBy(0, accounts.secondOwner, accounts.firstOwner, 0)
    .thenRelevantIssuances(accounts.firstOwner, [0])
    .thenRelevantIssuances(accounts.secondOwner, [0])
    .thenTemporaryLicenseHolders(0, accounts.firstOwner, [accounts.secondOwner])
    .thenTemporaryLicenseHolders(0, accounts.secondOwner, [])
  });

  it("allows the sender to reclaim the licenses piece by piece", function() {
    var licenseContract;
    return LicenseContract.deployed().then(function(instance) {
      licenseContract = instance;
      return licenseContract.transferTemporarily(0, accounts.secondOwner, 20, {from: accounts.firstOwner});
    })
    .then(function() {
      return licenseContract.reclaim(0, accounts.secondOwner, 5, {from: accounts.firstOwner})
    })
    .thenBalance(0, accounts.firstOwner, 55)
    .thenBalance(0, accounts.secondOwner, 15)
    .then(function() {
      licenseContract.reclaim(0, accounts.secondOwner, 5, {from: accounts.firstOwner})
    })
    .thenBalance(0, accounts.firstOwner, 60)
    .thenBalance(0, accounts.secondOwner, 10)
    .thenTemporaryBalance(0, accounts.firstOwner, 0)
    .thenTemporaryBalance(0, accounts.secondOwner, 10)
    .thenTemporaryBalanceReclaimableBy(0, accounts.secondOwner, accounts.firstOwner, 10)
  });

  it("does not allow the temporary owner to transfer the licenses on", function() {
    return LicenseContract.deployed().then(function(instance) {
      return instance.transfer(0, accounts.thirdOwner, 5, {from:accounts.secondOwner});
    })
    .thenSolidityThrow();
  });

  it("does not allow the temporary owner to lend the licenses on", function() {
    return LicenseContract.deployed().then(function(instance) {
      return instance.transferTemporarily(0, accounts.thirdOwner, 5, {from:accounts.secondOwner});
    })
    .thenSolidityThrow();
  });

  it("does not work if the sender does not own enough licenses", function() {
    return LicenseContract.deployed().then(function(instance) {
      return instance.transferTemporarily(0, accounts.secondOwner, 100, {from: accounts.firstOwner});
    })
    .thenSolidityThrow();
  });

  it("does not allow anyone but the original owner to reclaim licenses", function() {
    return LicenseContract.deployed().then(function(instance) {
      return instance.reclaim(0, accounts.secondOwner, 5, {from:accounts.thirdOwner});
    })
    .thenSolidityThrow();
  });

  it("does not work if the license contract has been revoked", function() {
    var licenseContract;
    return LicenseContract.deployed().then(function(instance) {
      licenseContract = instance;
      return licenseContract.revoke(0, "n/a", {from: accounts.issuer});
    })
    .then(function() {
      return licenseContract.transferTemporarily(0, accounts.secondOwner, 10, {from: accounts.firstOwner});
    })
    .thenSolidityThrow();
  })

  it("does not allow licenses to be reclaimed if the license contract has been revoked", function() {
    return LicenseContract.deployed().then(function(instance) {
      return instance.reclaim(0, accounts.secondOwner, 5, {from: accounts.firstOwner});
    })
    .thenSolidityThrow();
  });
});

contract("Revoking an issuing", function(accounts) {
  accounts = require("../accounts.js")(accounts);

  before(function() {
    var licenseContract;
    return LicenseContract.deployed().then(function(instance) {
      licenseContract = instance;
      return licenseContract.sign("0x051381", {from: accounts.issuer});
    });
  });

  it("cannot be performed by anyone but the issuer", function() {
    var licenseContract;
    return LicenseContract.deployed().then(function(instance) {
      licenseContract = instance;
      return licenseContract.issueLicense("Desc2", "ID", accounts.firstOwner, 70, "Remark", 1509552789, {from:accounts.issuer, value: 500});
    })
    .then(function() {
      return licenseContract.revoke(0, "n/a", {from: accounts.firstOwner});
    })
    .thenSolidityThrow();
  });

  it("cannot be performed by the LOB root", function() {
    return LicenseContract.deployed().then(function(instance) {
      return instance.issueLicense("Desc", "ID", accounts.firstOwner, 70, "Remark", 1509552789, {from:accounts.lobRoot, value: 500});
    }).thenSolidityThrow();
  });

  it("cannot be performed by the LOB root owner if it has not taken over control", function() {
    return LicenseContract.deployed().then(function(instance) {
      return instance.issueLicense("Desc", "ID", accounts.firstOwner, 70, "Remark", 1509552789, {from:accounts.lobRootOwner, value: 500});
    }).thenSolidityThrow();
  });

  it("can be performed by the issuer", function() {
    var licenseContract;
    return LicenseContract.deployed().then(function(instance) {
      licenseContract = instance;
      return licenseContract.issueLicense("Desc2", "ID", accounts.firstOwner, 70, "Remark", 1509552789, {from:accounts.issuer, value: 500});
    })
    .then(function() {
      return licenseContract.revoke(0, "My revocation reason", {from: accounts.issuer});
    })
    .then(function() {
      return licenseContract.issuances(0);
    })
    .then(function(issuanceData) {
      var issuance = new Issuance(issuanceData);
      assert.equal(issuance.revoked, true);
      assert.equal(issuance.revocationReason, "My revocation reason");
    })
  });

  it("does not allow license transfer after the revocation", function() {
    return LicenseContract.deployed().then(function(instance) {
      return instance.transfer(0, accounts.secondOwner, 85, {from:accounts.firstOwner});
    }).thenSolidityThrow();
  });
});

contract("Disabling the license contract", function(accounts) {
  accounts = require("../accounts.js")(accounts);

  before(function() {
    var licenseContract;
    return LicenseContract.deployed().then(function(instance) {
      licenseContract = instance;
      return licenseContract.sign("0x051381", {from: accounts.issuer});
    })
    .then(function() {
      return licenseContract.issueLicense("Desc", "ID", accounts.firstOwner, 70, "Remark", 1509552789, {from:accounts.issuer, value: 500});
    });
  });

  it("cannot be performed by anyone else", function() {
    return LicenseContract.deployed().then(function(instance) {
      return instance.disable({from: accounts.firstOwner});
    }).thenSolidityThrow();
  });

  it("cannot be done by the LOB root", function() {
    var licenseContract;
    return LicenseContract.deployed().then(function(instance) {
      return instance.disable({from: accounts.lobRoot});
    })
    .thenSolidityThrow();
  });

  it("cannot be done by the LOB root owner", function() {
    var licenseContract;
    return LicenseContract.deployed().then(function(instance) {
      return instance.disable({from: accounts.lobRootOwner});
    })
    .thenSolidityThrow();
  });

  it("can be done by the issuer", function() {
    var licenseContract;
    return LicenseContract.deployed().then(function(instance) {
      licenseContract = instance;
      return licenseContract.disable({from: accounts.issuer});
    })
    .then(function() {
      return licenseContract.disabled();
    })
    .then(function(disabled) {
      assert.equal(disabled.valueOf(), true);
    });
  });

  it("does not allow the issuance of licenses after the contract has been disabled", function() {
    var licenseContract;
    return LicenseContract.deployed().then(function(instance) {
      return instance.issueLicense("Desc", "ID", accounts.firstOwner, 70, "Remark", 1509552789, {from:accounts.issuer});
    })
    .thenSolidityThrow();
  });

  it("does not allow issuances to be revoked after the contract has been disabled", function() {
    var licenseContract;
    return LicenseContract.deployed().then(function(instance) {
      return instance.revoke(0, "", {from: accounts.issuer});
    })
    .thenSolidityThrow();
  });
});

contract("Setting the issuance fee", function(accounts) {
  accounts = require("../accounts.js")(accounts);

  it("can be performed by the LOB root", function() {
    var licenseContract;
    return LicenseContract.deployed().then(function(instance) {
      licenseContract = instance;
      return licenseContract.setIssuanceFee(700, {from: accounts.lobRoot});
    })
    .then(function() {
      return licenseContract.issuanceFee();
    })
    .then(function(issuanceFee) {
      assert.equal(issuanceFee.valueOf(), 700);
    });
  });

  it("cannot be done by anyone but the LOB root", function() {
    return LicenseContract.deployed().then(function(instance) {
      return instance.setIssuanceFee(700, {from: accounts.issuer});
    })
    .thenSolidityThrow();
  });
});

contract("Withdrawing fees", function(accounts) {
  accounts = require("../accounts.js")(accounts);

  before(function() {
    var licenseContract;
    return LicenseContract.deployed().then(function(instance) {
      licenseContract = instance;
      return licenseContract.sign("0x051381", {from: accounts.issuer});
    });
  });

  it("can be done by the LOB root", function() {
    var licenseContract;
    return LicenseContract.deployed().then(function(instance) {
      licenseContract = instance;
      return licenseContract.issueLicense("Desc", "ID", accounts.firstOwner, 70, "Remark", 1509552789, {from:accounts.issuer, value: 7000});
    }).then(function() {
      return licenseContract.withdraw(6000, accounts.lobRoot, {from:accounts.lobRoot})
    }).then(function() {
      return licenseContract.withdraw(1000, accounts.lobRoot, {from:accounts.lobRoot})
    });
  });

  it("connot be done by anyone but the LOB root", function() {
    var licenseContract;
    return LicenseContract.deployed().then(function(instance) {
      licenseContract = instance;
      return licenseContract.issueLicense("Desc", "ID", accounts.firstOwner, 70, "Remark", 1509552789, {from:accounts.issuer, value: 7000});
    }).then(function() {
      return licenseContract.withdraw(6000, accounts.lobRoot, {from:accounts.issuer})
    }).thenSolidityThrow();
  });
});

contract("Taking over management", function(accounts) {
  accounts = require("../accounts.js")(accounts);

  before(function() {
    var licenseContract;
    return LicenseContract.deployed().then(function(instance) {
      licenseContract = instance;
      return licenseContract.sign("0x051381", {from: accounts.issuer});
    })
    .then(function() {
      return licenseContract.issueLicense("Desc", "ID", accounts.firstOwner, 70, "Remark", 1509552789, {from:accounts.issuer, value: 7000});
    })
    .then(function() {
      return licenseContract.issueLicense("Desc2", "ID2", accounts.firstOwner, 100, "Remark2", 1509552789, {from:accounts.issuer, value: 7000});
    });
  });

  it("cannot be done by anyone but the LOB root", function() {
    var licenseContract;
    return LicenseContract.deployed().then(function(instance) {
      licenseContract = instance;
    }).then(function() {
      return licenseContract.takeOverManagementControl(accounts.issuer, {from: accounts.issuer});
    }).thenSolidityThrow();
  });

  it("can be done by the LOB root", function() {
    var licenseContract;
    return LicenseContract.deployed().then(function(instance) {
      licenseContract = instance;
      return licenseContract.takeOverManagementControl(accounts.manager, {from: accounts.lobRoot});
    }).then(function() {
      licenseContract.managerAddress();
    }).then(function(managerAddress) {
      assert.equal(managerAddress, accounts.managerAddress);
    })
  });

  it("disallows the issuer to issue licenses", function() {
    var licenseContract;
    return LicenseContract.deployed().then(function(instance) {
      licenseContract = instance;
      return licenseContract.issueLicense("Desc", "ID", accounts.firstOwner, 70, "Remark", 1509552789, {from:accounts.issuer, value: 7000});
    }).thenSolidityThrow();
  });

  it("disallows the issuer to revoke licenses", function() {
    var licenseContract;
    return LicenseContract.deployed().then(function(instance) {
      licenseContract = instance;
      return licenseContract.revoke(0, "", {from: accounts.issuer});
    }).thenSolidityThrow();
  });

  it("disallows the issuer to disable the license contract", function() {
    var licenseContract;
    return LicenseContract.deployed().then(function(instance) {
      licenseContract = instance;
      return licenseContract.disable({from: accounts.issuer});
    }).thenSolidityThrow();
  });

  it("allows the manager to revoke licenses", function() {
    var licenseContract;
    return LicenseContract.deployed().then(function(instance) {
      licenseContract = instance;
      return licenseContract.revoke(0, "", {from: accounts.manager});
    }).then(function() {
      return licenseContract.issuances(0); 
    }).then(function(issuance) {
      assert.equal(new Issuance(issuance).revoked, true);
    });
  });

  it("does not allow the LOB root to issue licenses", function() {
    var licenseContract;
    return LicenseContract.deployed().then(function(instance) {
      licenseContract = instance;
      return licenseContract.issueLicense("Desc", "ID", accounts.firstOwner, 70, "Remark", 1509552789, {from:accounts.manager, value: 7000});
    }).thenSolidityThrow();
  });

  it("allows the LOB root to disable the license contract", function() {
    var licenseContract;
    return LicenseContract.deployed().then(function(instance) {
      licenseContract = instance;
      return licenseContract.disable({from: accounts.manager});
    }).then(function() {
      return licenseContract.disabled();
    }).then(function(disabled) {
      assert.equal(disabled, true);
    });
  });

  it("allows the manager to revoke licenses even if the license contract has been disabled", function() {
    var licenseContract;
    return LicenseContract.deployed().then(function(instance) {
      licenseContract = instance;
      return licenseContract.revoke(1, "", {from: accounts.manager});
    }).then(function() {
      return licenseContract.issuances(1); 
    }).then(function(issuance) {
      assert.equal(new Issuance(issuance).revoked, true);
    });
  });
})
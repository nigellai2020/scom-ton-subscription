var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
define("@scom/scom-ton-subscription/index.css.ts", ["require", "exports", "@ijstech/components"], function (require, exports, components_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.inputStyle = void 0;
    exports.inputStyle = components_1.Styles.style({
        $nest: {
            '> input': {
                textAlign: 'right'
            }
        }
    });
});
define("@scom/scom-ton-subscription/interface.ts", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("@scom/scom-ton-subscription/model.ts", ["require", "exports", "@ijstech/components", "@ijstech/eth-wallet"], function (require, exports, components_2, eth_wallet_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SubscriptionModel = void 0;
    class SubscriptionModel {
        get wallets() {
            return [
                {
                    name: 'tonwallet'
                }
            ];
        }
        get tokens() {
            return [
                {
                    chainId: undefined,
                    name: "Toncoin",
                    decimals: 18,
                    symbol: "TON"
                }
            ];
        }
        get durationUnits() {
            return [
                {
                    label: 'Day(s)',
                    value: 'days'
                },
                {
                    label: 'Month(s)',
                    value: 'months'
                },
                {
                    label: 'Year(s)',
                    value: 'years'
                }
            ];
        }
        getDurationInDays(duration, unit, startDate) {
            if (unit === 'days') {
                return duration;
            }
            else {
                const dateFormat = 'YYYY-MM-DD';
                const start = startDate ? (0, components_2.moment)(startDate.format(dateFormat), dateFormat) : (0, components_2.moment)();
                const end = (0, components_2.moment)(start).add(duration, unit);
                const diff = end.diff(start, 'days');
                return diff;
            }
        }
        formatNumber(value, decimalFigures) {
            if (typeof value === 'object') {
                value = value.toFixed();
            }
            const minValue = '0.0000001';
            return components_2.FormatUtils.formatNumber(value, { decimalFigures: decimalFigures !== undefined ? decimalFigures : 4, minValue, hasTrailingZero: false });
        }
        ;
        async initWallet() {
            await eth_wallet_1.Wallet.getClientInstance().init();
        }
        async connectWallet() { }
        isClientWalletConnected() {
            return true;
        }
        async loadLib(moduleDir) {
            let self = this;
            return new Promise((resolve, reject) => {
                components_2.RequireJS.config({
                    baseUrl: `${moduleDir}/lib`,
                    paths: {
                        'tonweb': 'tonweb'
                    }
                });
                components_2.RequireJS.require(['tonweb'], function (TonWeb) {
                    self.tonweb = new TonWeb();
                    resolve(self.tonweb);
                });
            });
        }
        async getTransactionHashByMessageHash(messageHash) {
            return new Promise(async (resolve, reject) => {
                // sleep for 20 seconds
                setTimeout(async () => {
                    const refetchLimit = 5;
                    let refetches = 0;
                    // wait for transaction
                    const interval = setInterval(async () => {
                        refetches += 1;
                        try {
                            const TONCENTER_API_ENDPOINT = 'https://toncenter.com/api/v3';
                            const response = await fetch(`${TONCENTER_API_ENDPOINT}/transactionsByMessage?msg_hash=${encodeURIComponent(messageHash)}&limit=1&offset=0`);
                            const data = await response.json();
                            const transaction = data.transactions[0];
                            if (transaction.hash) {
                                clearInterval(interval);
                                resolve(transaction.hash);
                            }
                        }
                        catch (err) {
                        }
                        if (refetches >= refetchLimit) {
                            clearInterval(interval);
                            reject(new Error('Failed to get transaction hash'));
                        }
                    }, 8000);
                }, 20000);
            });
        }
        async getTransactionHash(boc) {
            const bocCellBytes = await this.tonweb.boc.Cell.oneFromBoc(this.tonweb.utils.base64ToBytes(boc)).hash();
            const messageHash = this.tonweb.utils.bytesToBase64(bocCellBytes);
            const transactionHash = await this.getTransactionHashByMessageHash(messageHash);
            return transactionHash;
        }
        async constructPayload(msg) {
            const cell = new this.tonweb.boc.Cell();
            cell.bits.writeUint(0, 32);
            cell.bits.writeString(msg);
            const bocBytes = await cell.toBoc();
            return this.tonweb.utils.bytesToBase64(bocBytes);
        }
        async getTokenInfo(address, chainId) {
            let token;
            const wallet = eth_wallet_1.Wallet.getClientInstance();
            wallet.chainId = chainId;
            const isValidAddress = wallet.isAddress(address);
            if (isValidAddress) {
                const tokenAddress = wallet.toChecksumAddress(address);
                const tokenInfo = await wallet.tokenInfo(tokenAddress);
                if (tokenInfo?.symbol) {
                    token = {
                        chainId,
                        address: tokenAddress,
                        name: tokenInfo.name,
                        decimals: tokenInfo.decimals,
                        symbol: tokenInfo.symbol
                    };
                }
            }
            return token;
        }
        async updateCommunitySubscription(dataManager, creatorId, communityId, startTime, endTime, txHash) {
            await dataManager.updateCommunitySubscription({
                communityCreatorId: creatorId,
                communityId: communityId,
                start: startTime,
                end: endTime,
                txHash: txHash
            });
        }
    }
    exports.SubscriptionModel = SubscriptionModel;
});
define("@scom/scom-ton-subscription", ["require", "exports", "@ijstech/components", "@ijstech/eth-wallet", "@scom/scom-ton-subscription/index.css.ts", "@scom/scom-ton-subscription/model.ts"], function (require, exports, components_3, eth_wallet_2, index_css_1, model_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const Theme = components_3.Styles.Theme.ThemeVars;
    const path = components_3.application.currentModuleDir;
    let ScomTonSubscription = class ScomTonSubscription extends components_3.Module {
        constructor() {
            super(...arguments);
            this._isRenewal = false;
            this._data = {};
            this.showTxStatusModal = (status, content, exMessage) => {
                if (!this.txStatusModal)
                    return;
                let params = { status };
                if (status === 'success') {
                    params.txtHash = content;
                }
                else {
                    params.content = content;
                }
                if (exMessage) {
                    params.exMessage = exMessage;
                }
                this.txStatusModal.message = { ...params };
                this.txStatusModal.showModal();
            };
        }
        get dataManager() {
            return this._dataManager || components_3.application.store?.mainDataManager;
        }
        set dataManager(manager) {
            this._dataManager = manager;
        }
        get isRenewal() {
            return this._isRenewal;
        }
        set isRenewal(value) {
            this._isRenewal = value;
        }
        get renewalDate() {
            return this._renewalDate;
        }
        set renewalDate(value) {
            this._renewalDate = value;
            if (this.edtStartDate) {
                this.edtStartDate.value = value > 0 ? (0, components_3.moment)(value * 1000) : (0, components_3.moment)();
                this.onDurationChanged();
            }
        }
        get duration() {
            return Number(this.edtDuration.value) || 0;
        }
        get durationUnit() {
            return (this.comboDurationUnit.selectedItem?.value || 'days');
        }
        get basePrice() {
            const price = new eth_wallet_2.BigNumber(this._data.tokenAmount);
            let basePrice = price;
            if (this.discountApplied) {
                if (this.discountApplied.discountPercentage > 0) {
                    basePrice = price.times(1 - this.discountApplied.discountPercentage / 100);
                }
                else if (this.discountApplied.fixedPrice > 0) {
                    basePrice = new eth_wallet_2.BigNumber(this.discountApplied.fixedPrice);
                }
            }
            return basePrice;
        }
        get totalAmount() {
            let basePrice = this.basePrice;
            const pricePerDay = basePrice.div(this._data.durationInDays);
            const days = this.subscriptionModel.getDurationInDays(this.duration, this.durationUnit, this.edtStartDate.value);
            return pricePerDay.times(days);
        }
        showLoading() {
            this.pnlLoading.visible = true;
            this.pnlBody.visible = false;
        }
        hideLoading() {
            this.pnlLoading.visible = false;
            this.pnlBody.visible = true;
        }
        getConfigurators() {
            return [
                {
                    name: 'Builder Configurator',
                    target: 'Builders',
                    getData: this.getData.bind(this),
                    setData: async (data) => {
                        await this.setData({ ...data });
                    },
                    getTag: this.getTag.bind(this),
                    setTag: this.setTag.bind(this)
                },
            ];
        }
        getData() {
            return this._data;
        }
        async setData(data) {
            this.showLoading();
            this._data = data;
            this.edtStartDate.value = undefined;
            this.edtDuration.value = '';
            this.comboDurationUnit.selectedItem = this.subscriptionModel.durationUnits[0];
            await this.subscriptionModel.initWallet();
            await this.refreshDApp();
            this.hideLoading();
        }
        getTag() {
            return this.tag;
        }
        updateTag(type, value) {
            this.tag[type] = this.tag[type] ?? {};
            for (let prop in value) {
                if (value.hasOwnProperty(prop))
                    this.tag[type][prop] = value[prop];
            }
        }
        async setTag(value) {
            const newValue = value || {};
            if (!this.tag)
                this.tag = {};
            for (let prop in newValue) {
                if (newValue.hasOwnProperty(prop)) {
                    if (prop === 'light' || prop === 'dark')
                        this.updateTag(prop, newValue[prop]);
                    else
                        this.tag[prop] = newValue[prop];
                }
            }
            if (this.containerDapp)
                this.containerDapp.setTag(this.tag);
            this.updateTheme();
        }
        updateStyle(name, value) {
            value ?
                this.style.setProperty(name, value) :
                this.style.removeProperty(name);
        }
        updateTheme() {
            const themeVar = this.containerDapp?.theme || 'dark';
            this.updateStyle('--text-primary', this.tag[themeVar]?.fontColor);
            this.updateStyle('--background-main', this.tag[themeVar]?.backgroundColor);
            this.updateStyle('--input-font_color', this.tag[themeVar]?.inputFontColor);
            this.updateStyle('--input-background', this.tag[themeVar]?.inputBackgroundColor);
            this.updateStyle('--colors-primary-main', this.tag[themeVar]?.buttonBackgroundColor);
        }
        async refreshDApp() {
            try {
                this.determineBtnSubmitCaption();
                this.pnlBody.visible = true;
                this.token = this.subscriptionModel.tokens.find(token => token.address === this._data.currency || token.symbol === this._data.currency);
                this.edtStartDate.value = this.isRenewal && this.renewalDate ? (0, components_3.moment)(this.renewalDate * 1000) : (0, components_3.moment)();
                this.pnlStartDate.visible = !this.isRenewal;
                this.lblStartDate.caption = this.edtStartDate.value.format('DD/MM/YYYY');
                this.lblStartDate.visible = this.isRenewal;
                const rule = this._data.discountRuleId ? this._data.discountRules.find(rule => rule.id === this._data.discountRuleId) : null;
                const isExpired = rule && rule.endTime && rule.endTime < (0, components_3.moment)().unix();
                if (isExpired)
                    this._data.discountRuleId = undefined;
                if (rule && !isExpired) {
                    if (!this.isRenewal && rule.startTime && rule.startTime > this.edtStartDate.value.unix()) {
                        this.edtStartDate.value = (0, components_3.moment)(rule.startTime * 1000);
                    }
                    this.edtDuration.value = rule.minDuration || "1";
                    this.comboDurationUnit.selectedItem = this.subscriptionModel.durationUnits[0];
                    this.discountApplied = rule;
                    this._updateEndDate();
                    this._updateTotalAmount();
                }
                else {
                    this.edtDuration.value = this._data.durationInDays || "";
                    this.onDurationChanged();
                }
            }
            catch (error) {
                console.error(error);
            }
        }
        _updateEndDate() {
            if (!this.edtStartDate.value) {
                this.lblEndDate.caption = '-';
                return;
            }
            const dateFormat = 'YYYY-MM-DD';
            const startDate = (0, components_3.moment)(this.edtStartDate.value.format(dateFormat), dateFormat);
            this.lblEndDate.caption = startDate.add(this.duration, this.durationUnit).format('DD/MM/YYYY');
        }
        _updateDiscount() {
            this.discountApplied = undefined;
            if (!this._data.discountRules?.length || !this.duration || !this.edtStartDate.value)
                return;
            const price = new eth_wallet_2.BigNumber(this._data.tokenAmount);
            const startTime = this.edtStartDate.value.unix();
            const days = this.subscriptionModel.getDurationInDays(this.duration, this.durationUnit, this.edtStartDate.value);
            let discountAmount;
            for (let rule of this._data.discountRules) {
                if (rule.discountApplication === 0 && this.isRenewal)
                    continue;
                if (rule.discountApplication === 1 && !this.isRenewal)
                    continue;
                if ((rule.startTime > 0 && startTime < rule.startTime) || (rule.endTime > 0 && startTime > rule.endTime) || rule.minDuration > days)
                    continue;
                let basePrice = price;
                if (rule.discountPercentage > 0) {
                    basePrice = price.times(1 - rule.discountPercentage / 100);
                }
                else if (rule.fixedPrice > 0) {
                    basePrice = new eth_wallet_2.BigNumber(rule.fixedPrice);
                }
                let tmpDiscountAmount = price.minus(basePrice).div(this._data.durationInDays).times(days);
                if (!this.discountApplied || tmpDiscountAmount.gt(discountAmount)) {
                    this.discountApplied = rule;
                    discountAmount = tmpDiscountAmount;
                }
            }
        }
        _updateTotalAmount() {
            const duration = Number(this.edtDuration.value) || 0;
            if (!duration)
                this.lblOrderTotal.caption = `0 ${this.token?.symbol || ''}`;
            this.pnlDiscount.visible = false;
            if (this.discountApplied) {
                if (this.discountApplied.discountPercentage > 0) {
                    this.lblDiscount.caption = `Discount (${this.discountApplied.discountPercentage}% off)`;
                    this.pnlDiscount.visible = true;
                }
                else if (this.discountApplied.fixedPrice > 0) {
                    this.lblDiscount.caption = "Discount";
                    this.pnlDiscount.visible = true;
                }
                if (this.pnlDiscount.visible) {
                    const price = new eth_wallet_2.BigNumber(this._data.tokenAmount);
                    const days = this.subscriptionModel.getDurationInDays(this.duration, this.durationUnit, this.edtStartDate.value);
                    const discountAmount = price.minus(this.basePrice).div(this._data.durationInDays).times(days);
                    this.lblDiscountAmount.caption = `-${this.subscriptionModel.formatNumber(discountAmount, 6)} ${this.token?.symbol || ''}`;
                }
            }
            this.lblOrderTotal.caption = `${this.subscriptionModel.formatNumber(this.totalAmount, 6)} ${this.token?.symbol || ''}`;
        }
        onStartDateChanged() {
            this._updateEndDate();
            this._updateDiscount();
        }
        onDurationChanged() {
            this._updateEndDate();
            this._updateDiscount();
            this._updateTotalAmount();
        }
        onDurationUnitChanged() {
            this._updateEndDate();
            this._updateDiscount();
            this._updateTotalAmount();
        }
        updateSubmitButton(submitting) {
            this.btnTonSubmit.rightIcon.spin = submitting;
            this.btnTonSubmit.rightIcon.visible = submitting;
        }
        initTonWallet() {
            try {
                let UI = window['TON_CONNECT_UI'];
                this.tonConnectUI = new UI.TonConnectUI({
                    manifestUrl: 'https://ton.noto.fan/tonconnect/manifest.json',
                    buttonRootId: 'pnlHeader'
                });
                this.tonConnectUI.connectionRestored.then(async (restored) => {
                    this.isWalletConnected = this.tonConnectUI.connected;
                    this.btnTonSubmit.enabled = true;
                    this.determineBtnSubmitCaption();
                });
                this.tonConnectUI.onStatusChange((walletAndwalletInfo) => {
                    this.isWalletConnected = !!walletAndwalletInfo;
                    this.determineBtnSubmitCaption();
                });
            }
            catch (err) {
                alert(err);
            }
        }
        async connectTonWallet() {
            try {
                await this.tonConnectUI.openModal();
            }
            catch (err) {
                alert(err);
            }
        }
        determineBtnSubmitCaption() {
            if (!this.isWalletConnected) {
                this.btnTonSubmit.caption = 'Connect Wallet';
            }
            else {
                this.btnTonSubmit.caption = this.isRenewal ? 'Renew Subscription' : 'Subscribe';
            }
        }
        async onSubmit() {
            if (!this.isWalletConnected) {
                this.connectTonWallet();
                return;
            }
            this.doSubmitAction();
        }
        async doSubmitAction() {
            if (!this._data)
                return;
            if (!this.edtStartDate.value) {
                this.showTxStatusModal('error', 'Start Date Required');
                return;
            }
            if (!this.edtDuration.value || this.duration <= 0 || !Number.isInteger(this.duration)) {
                this.showTxStatusModal('error', !this.edtDuration.value ? 'Duration Required' : 'Invalid Duration');
                return;
            }
            this.updateSubmitButton(true);
            const startTime = this.edtStartDate.value.unix();
            const endTime = components_3.moment.unix(startTime).add(this.duration, this.durationUnit).unix();
            let subscriptionFee = this.totalAmount;
            let subscriptionFeeToAddress = this._data.recipient;
            //https://ton-connect.github.io/sdk/modules/_tonconnect_ui.html#send-transaction
            const transaction = {
                validUntil: Math.floor(Date.now() / 1000) + 60,
                messages: [
                    {
                        address: subscriptionFeeToAddress,
                        amount: subscriptionFee.times(1e9).toFixed(),
                        // payload: "base64bocblahblahblah==" // just for instance. Replace with your transaction payload or remove
                    }
                ]
            };
            try {
                const result = await this.tonConnectUI.sendTransaction(transaction);
                // alert(JSON.stringify(result));
                // you can use signed boc to find the transaction 
                // const someTxData = await myAppExplorerService.getTransaction(result.boc);
                // alert('Transaction was sent successfully', someTxData);
                const txHash = await this.subscriptionModel.getTransactionHash(result.boc);
                await this.subscriptionModel.updateCommunitySubscription(this.dataManager, this._data.creatorId, this._data.communityId, startTime, endTime, txHash);
                if (this.onMintedNFT)
                    this.onMintedNFT();
            }
            catch (e) {
                console.error(e);
            }
            this.updateSubmitButton(false);
        }
        async init() {
            super.init();
            const moduleDir = this['currentModuleDir'] || path;
            this.subscriptionModel = new model_1.SubscriptionModel();
            const durationUnits = this.subscriptionModel.durationUnits;
            this.comboDurationUnit.items = durationUnits;
            this.comboDurationUnit.selectedItem = durationUnits[0];
            const data = {
                wallets: this.subscriptionModel.wallets,
                networks: [],
                showHeader: false,
            };
            this.initTonWallet();
            if (this.containerDapp?.setData)
                await this.containerDapp.setData(data);
            await this.subscriptionModel.loadLib(moduleDir);
        }
        render() {
            return (this.$render("i-panel", null,
                this.$render("i-scom-dapp-container", { id: "containerDapp" },
                    this.$render("i-panel", { padding: { top: '0.5rem', bottom: '0.5rem', left: '1.75rem', right: '1.75rem' }, background: { color: Theme.background.modal } },
                        this.$render("i-stack", { id: "pnlHeader", direction: "horizontal", alignItems: "center", justifyContent: "end" })),
                    this.$render("i-panel", { background: { color: Theme.background.main } },
                        this.$render("i-stack", { id: "pnlLoading", direction: "vertical", height: "100%", alignItems: "center", justifyContent: "center", padding: { top: "1rem", bottom: "1rem", left: "1rem", right: "1rem" }, visible: false },
                            this.$render("i-panel", { class: 'spinner' })),
                        this.$render("i-stack", { direction: "vertical", padding: { top: '1.5rem', bottom: '1.25rem', left: '1.25rem', right: '1.5rem' }, alignItems: "center" },
                            this.$render("i-stack", { direction: "vertical", width: "100%", maxWidth: 600, gap: '0.5rem' },
                                this.$render("i-stack", { id: "pnlBody", direction: "vertical", gap: "0.5rem" },
                                    this.$render("i-stack", { direction: "horizontal", width: "100%", alignItems: "center", justifyContent: "space-between", gap: 10 },
                                        this.$render("i-label", { caption: "Starts", font: { bold: true, size: '1rem' } }),
                                        this.$render("i-panel", { id: "pnlStartDate", width: "50%" },
                                            this.$render("i-datepicker", { id: "edtStartDate", height: 36, width: "100%", type: "date", placeholder: "dd/mm/yyyy", background: { color: Theme.input.background }, font: { size: '1rem' }, border: { radius: "0.375rem" }, onChanged: this.onStartDateChanged })),
                                        this.$render("i-label", { id: "lblStartDate", font: { size: '1rem' }, visible: false })),
                                    this.$render("i-stack", { direction: "horizontal", width: "100%", alignItems: "center", justifyContent: "space-between", gap: 10 },
                                        this.$render("i-label", { caption: "Duration", font: { bold: true, size: '1rem' } }),
                                        this.$render("i-stack", { direction: "horizontal", width: "50%", alignItems: "center", gap: "0.5rem" },
                                            this.$render("i-panel", { width: "50%" },
                                                this.$render("i-input", { id: "edtDuration", height: 36, width: "100%", class: index_css_1.inputStyle, inputType: 'number', font: { size: '1rem' }, border: { radius: 4, style: 'none' }, padding: { top: '0.25rem', bottom: '0.25rem', left: '0.5rem', right: '0.5rem' }, onChanged: this.onDurationChanged })),
                                            this.$render("i-panel", { width: "50%" },
                                                this.$render("i-combo-box", { id: "comboDurationUnit", height: 36, width: "100%", icon: { width: 14, height: 14, name: 'angle-down', fill: Theme.divider }, border: { width: 1, style: 'solid', color: Theme.divider, radius: 5 }, onChanged: this.onDurationUnitChanged })))),
                                    this.$render("i-stack", { direction: "horizontal", width: "100%", alignItems: "center", justifyContent: "space-between", gap: 10 },
                                        this.$render("i-label", { caption: "Ends", font: { bold: true, size: '1rem' } }),
                                        this.$render("i-label", { id: "lblEndDate", font: { size: '1rem' } })),
                                    this.$render("i-stack", { id: "pnlDiscount", direction: "horizontal", width: "100%", justifyContent: "space-between", alignItems: "center", gap: "0.5rem", lineHeight: 1.5, visible: false },
                                        this.$render("i-label", { id: "lblDiscount", caption: "Discount", font: { bold: true, size: '1rem' } }),
                                        this.$render("i-label", { id: "lblDiscountAmount", font: { size: '1rem' } })),
                                    this.$render("i-stack", { width: "100%", direction: "horizontal", justifyContent: "space-between", alignItems: 'center', gap: "0.5rem", lineHeight: 1.5 },
                                        this.$render("i-stack", { direction: "horizontal", alignItems: 'center', gap: "0.5rem" },
                                            this.$render("i-label", { caption: 'You are going to pay', font: { bold: true, size: '1rem' } }),
                                            this.$render("i-icon", { id: "iconOrderTotal", width: 20, height: 20, name: "question-circle", fill: Theme.background.modal, tooltip: { content: 'A commission fee of 0% will be applied to the amount you input.' } })),
                                        this.$render("i-label", { id: 'lblOrderTotal', font: { size: '1rem' }, caption: "0" })),
                                    this.$render("i-stack", { direction: "vertical", width: "100%", justifyContent: "center", alignItems: "center", margin: { top: '0.5rem' }, gap: 8 },
                                        this.$render("i-button", { id: 'btnTonSubmit', width: '100%', caption: 'Subscribe', padding: { top: '1rem', bottom: '1rem', left: '1rem', right: '1rem' }, font: { size: '1rem', color: Theme.colors.primary.contrastText, bold: true }, rightIcon: { visible: false, fill: Theme.colors.primary.contrastText }, background: { color: Theme.background.gradient }, border: { radius: 12 }, enabled: false, onClick: this.onSubmit }))))),
                        this.$render("i-scom-tx-status-modal", { id: "txStatusModal" })))));
        }
    };
    ScomTonSubscription = __decorate([
        (0, components_3.customElements)('i-scom-ton-subscription')
    ], ScomTonSubscription);
    exports.default = ScomTonSubscription;
});

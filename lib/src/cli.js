#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeConfig = exports.readConfig = void 0;
// TODO put node banks and vaults inside the GroupConfig
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const yargs_1 = __importDefault(require("yargs/yargs"));
const helpers_1 = require("yargs/helpers");
const web3_js_1 = require("@gemachain/web3.js");
const commands_1 = require("./commands");
const config_1 = require("./config");
const client_1 = require("./client");
const utils_1 = require("./utils");
const clusterDesc = [
    'cluster',
    {
        describe: 'the cluster to connect to',
        default: 'devnet',
        choices: ['devnet', 'mainnet'],
    },
];
const configDesc = [
    'config',
    {
        describe: 'the config file to store all public keys',
        default: __dirname + '/ids.json',
        type: 'string',
    },
];
const keypairDesc = [
    'keypair',
    {
        describe: 'the keypair used to sign all transactions',
        default: os.homedir() + '/.config/solana/devnet.json',
        type: 'string',
    },
];
const groupDesc = [
    'group',
    { describe: 'the mango group name 🥭', type: 'string' },
];
const symbolDesc = [
    'symbol',
    { describe: 'the base token symbol', type: 'string' },
];
function openConnection(config, cluster) {
    return new web3_js_1.Connection(config.cluster_urls[cluster], 'processed');
}
function readKeypair(keypairPath) {
    return new web3_js_1.Account(JSON.parse(fs.readFileSync(keypairPath, 'utf-8')));
}
function readConfig(configPath) {
    return new config_1.Config(JSON.parse(fs.readFileSync(configPath, 'utf-8')));
}
exports.readConfig = readConfig;
function writeConfig(configPath, config) {
    fs.writeFileSync(configPath, JSON.stringify(config.toJson(), null, 2));
}
exports.writeConfig = writeConfig;
yargs_1.default(helpers_1.hideBin(process.argv)).command('init-group <group> <mangoProgramId> <serumProgramId> <quote_mint> <fees_vault>', 'initialize a new group', (y) => {
    return y
        .positional(...groupDesc)
        .positional('mangoProgramId', {
        describe: 'the program id of the mango smart contract',
        type: 'string',
    })
        .positional('serumProgramId', {
        describe: 'the program id of the serum dex smart contract',
        type: 'string',
    })
        .positional('quote_mint', {
        describe: 'the mint of the quote currency 💵',
        type: 'string',
    })
        .positional('fees_vault', {
        describe: 'the quote currency vault owned by Mango DAO token governance',
        type: 'string',
    })
        .option('quote_optimal_util', {
        describe: 'optimal utilization interest rate param for quote currency',
        default: 0.7,
        type: 'number',
    })
        .option('quote_optimal_rate', {
        describe: 'optimal interest rate param for quote currency',
        default: 0.06,
        type: 'number',
    })
        .option('quote_max_rate', {
        describe: 'max interest rate param for quote currency',
        default: 1.5,
        type: 'number',
    })
        .option('valid_interval', {
        describe: 'the interval where caches are no longer valid',
        default: 10,
        type: 'number',
    })
        .option('symbol', {
        describe: 'the quote symbol',
        default: 'USDC',
        type: 'string',
    })
        .option(...clusterDesc)
        .option(...configDesc)
        .option(...keypairDesc);
}, (args) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('init_group', args);
    const mangoProgramId = new web3_js_1.PublicKey(args.mangoProgramId);
    const serumProgramId = new web3_js_1.PublicKey(args.serumProgramId);
    const quoteMint = new web3_js_1.PublicKey(args.quote_mint);
    const feesVault = new web3_js_1.PublicKey(args.fees_vault);
    const account = readKeypair(args.keypair);
    const config = readConfig(args.config);
    const cluster = args.cluster;
    const connection = openConnection(config, cluster);
    const result = yield commands_1.initGroup(connection, account, cluster, args.group, mangoProgramId, serumProgramId, args.symbol, quoteMint, feesVault, args.valid_interval, args.quote_optimal_util, args.quote_optimal_rate, args.quote_max_rate);
    console.log(result);
    config.storeGroup(result);
    writeConfig(args.config, config);
    process.exit(0);
})).argv;
yargs_1.default(helpers_1.hideBin(process.argv)).command('add-oracle <group> <symbol>', 'add an oracle to the group', (y) => {
    return y
        .positional(...groupDesc)
        .positional(...symbolDesc)
        .option('provider', {
        describe: 'oracle provider',
        default: 'stub',
        choices: ['stub', 'pyth', 'switchboard'],
    })
        .option(...clusterDesc)
        .option(...configDesc)
        .option(...keypairDesc);
}, (args) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('add_oracle', args);
    const account = readKeypair(args.keypair);
    const config = readConfig(args.config);
    const cluster = args.cluster;
    const connection = openConnection(config, cluster);
    const group = config.getGroup(cluster, args.group);
    let result;
    if (args.provider === 'pyth') {
        result = yield commands_1.addPythOracle(connection, account, group, args.symbol);
    }
    else if (args.provider === 'switchboard') {
        result = yield commands_1.addSwitchboardOracle(connection, account, group, args.symbol);
    }
    else if (args.provider === 'stub') {
        result = yield commands_1.addStubOracle(connection, account, group, args.symbol);
    }
    else {
        throw new Error();
    }
    config.storeGroup(result);
    writeConfig(args.config, config);
    process.exit(0);
})).argv;
yargs_1.default(helpers_1.hideBin(process.argv)).command('set-oracle <group> <symbol> <value>', 'set stub oracle to given value', (y) => {
    return y
        .positional(...groupDesc)
        .positional(...symbolDesc)
        .positional('value', {
        describe: 'new oracle value is base_price * quote_unit / base_unit',
        type: 'number',
    })
        .option(...clusterDesc)
        .option(...configDesc)
        .option(...keypairDesc);
}, (args) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('set_oracle', args);
    const account = readKeypair(args.keypair);
    const config = readConfig(args.config);
    const cluster = args.cluster;
    const connection = openConnection(config, cluster);
    const group = config.getGroup(cluster, args.group);
    yield commands_1.setStubOracle(connection, account, group, args.symbol, args.value);
    process.exit(0);
})).argv;
yargs_1.default(helpers_1.hideBin(process.argv)).command('add-perp-market <group> <symbol>', 'add a perp market to the group', (y) => {
    return y
        .positional(...groupDesc)
        .positional(...symbolDesc)
        .option('maint_leverage', {
        default: 20,
        type: 'number',
    })
        .option('init_leverage', {
        default: 10,
        type: 'number',
    })
        .option('liquidation_fee', {
        default: 0.025,
        type: 'number',
    })
        .option('maker_fee', {
        default: 0.0,
        type: 'number',
    })
        .option('taker_fee', {
        default: 0.0005,
        type: 'number',
    })
        .option('base_lot_size', {
        default: 100,
        type: 'number',
    })
        .option('quote_lot_size', {
        default: 10,
        type: 'number',
    })
        .option('max_num_events', {
        default: 256,
        type: 'number',
    })
        .option('rate', {
        default: 1,
        type: 'number',
    })
        .option('max_depth_bps', {
        default: 200,
        type: 'number',
    })
        .option('target_period_length', {
        default: 3600,
        type: 'number',
    })
        .option('mngo_per_period', {
        // default: 11400, // roughly corresponds to 100m MNGO per year
        default: 0,
        type: 'number',
    })
        .option(...clusterDesc)
        .option(...configDesc)
        .option(...keypairDesc);
}, (args) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('add-perp-market', args);
    const account = readKeypair(args.keypair);
    const config = readConfig(args.config);
    const cluster = args.cluster;
    const connection = openConnection(config, cluster);
    const group = config.getGroup(cluster, args.group);
    const result = yield commands_1.addPerpMarket(connection, account, group, args.symbol, args.maint_leverage, args.init_leverage, args.liquidation_fee, args.maker_fee, args.taker_fee, args.base_lot_size, args.quote_lot_size, args.max_num_events, args.rate, args.max_depth_bps, args.target_period_length, args.mngo_per_period);
    config.storeGroup(result);
    writeConfig(args.config, config);
    process.exit(0);
})).argv;
yargs_1.default(helpers_1.hideBin(process.argv)).command('add-spot-market <group> <symbol> <mint_pk>', 'add a spot market to the group', (y) => {
    return y
        .positional(...groupDesc)
        .positional(...symbolDesc)
        .positional('mint_pk', {
        describe: 'the public key of the base token mint',
        type: 'string',
    })
        .option('market_pk', {
        default: '',
        describe: 'the public key of the spot market',
        type: 'string',
    })
        .option('base_lot_size', {
        default: 100,
        describe: 'Lot size of the base mint',
        type: 'number',
    })
        .option('quote_lot_size', {
        default: 10,
        describe: 'Lot size of the quote mint',
        type: 'number',
    })
        .option('maint_leverage', {
        default: 10,
        type: 'number',
    })
        .option('init_leverage', {
        default: 5,
        type: 'number',
    })
        .option('liquidation_fee', {
        default: 0.05,
        type: 'number',
    })
        .option('optimal_util', {
        describe: 'optimal utilization interest rate param',
        default: 0.7,
        type: 'number',
    })
        .option('optimal_rate', {
        describe: 'optimal interest rate param',
        default: 0.06,
        type: 'number',
    })
        .option('max_rate', {
        describe: 'max interest rate param',
        default: 1.5,
        type: 'number',
    })
        .option(...clusterDesc)
        .option(...configDesc)
        .option(...keypairDesc);
}, (args) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log('add-spot-market', args);
    const account = readKeypair(args.keypair);
    const config = readConfig(args.config);
    const cluster = args.cluster;
    const connection = openConnection(config, cluster);
    const group = config.getGroup(cluster, args.group);
    const quoteMintPk = (_a = config_1.getTokenBySymbol(group, group.quoteSymbol)) === null || _a === void 0 ? void 0 : _a.mintKey;
    const market_pk = args.market_pk
        ? new web3_js_1.PublicKey(args.market_pk)
        : yield commands_1.listMarket(connection, account, group, new web3_js_1.PublicKey(args.mint_pk), quoteMintPk, args.base_lot_size, args.quote_lot_size, group.serumProgramId);
    const result = yield commands_1.addSpotMarket(connection, account, group, args.symbol, market_pk, new web3_js_1.PublicKey(args.mint_pk), args.maint_leverage, args.init_leverage, args.liquidation_fee, args.optimal_util, args.optimal_rate, args.max_rate);
    config.storeGroup(result);
    writeConfig(args.config, config);
    process.exit(0);
})).argv;
yargs_1.default(helpers_1.hideBin(process.argv)).command('sanity-check <group>', 'check group conditions that always have to be true', (y) => {
    return y.positional(...groupDesc).option(...configDesc);
}, (args) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('sanity check', args);
    const config = readConfig(args.config);
    const groupConfig = config.getGroupWithName(args.group);
    const connection = openConnection(config, groupConfig.cluster);
    yield commands_1.sanityCheck(connection, groupConfig);
    process.exit(0);
})).argv;
yargs_1.default(helpers_1.hideBin(process.argv)).command('show <group> <mango_account_pk>', 'Print relevant details about a mango account', (y) => {
    return y
        .positional(...groupDesc)
        .positional('mango_account_pk', {
        describe: 'the public key of the MangoAccount',
        type: 'string',
    })
        .option(...configDesc);
}, (args) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('show', args);
    const config = readConfig(args.config);
    const groupConfig = config.getGroupWithName(args.group);
    const connection = openConnection(config, groupConfig.cluster);
    const client = new client_1.MangoClient(connection, groupConfig.mangoProgramId);
    const mangoGroup = yield client.getMangoGroup(groupConfig.publicKey);
    const mangoAccount = yield client.getMangoAccount(new web3_js_1.PublicKey(args.mango_account_pk), groupConfig.serumProgramId);
    const cache = yield mangoGroup.loadCache(connection);
    console.log(mangoAccount.toPrettyString(groupConfig, mangoGroup, cache));
    process.exit(0);
})).argv;
yargs_1.default(helpers_1.hideBin(process.argv)).command('verify-token-gov <token_account> <owner>', 'Verify the owner of token_account is a governance PDA', (y) => {
    return y
        .positional('token_account', {
        describe: 'the public key of the MangoAccount',
        type: 'string',
    })
        .positional('owner', {
        describe: 'The owner of the token_account',
        type: 'string',
    })
        .option('program_id', {
        default: 'GqTPL6qRf5aUuqscLh8Rg2HTxPUXfhhAXDptTLhp1t2J',
        describe: 'Mango DAO program id',
        type: 'string',
    })
        .option('realm', {
        default: 'DPiH3H3c7t47BMxqTxLsuPQpEC6Kne8GA9VXbxpnZxFE',
        describe: 'Realm of this governance',
        type: 'string',
    });
}, (args) => __awaiter(void 0, void 0, void 0, function* () {
    const programId = new web3_js_1.PublicKey(args.program_id);
    const realm = new web3_js_1.PublicKey(args.realm);
    const tokenAccount = new web3_js_1.PublicKey(args.token_account);
    const owner = new web3_js_1.PublicKey(args.owner);
    const [address, nonce] = yield web3_js_1.PublicKey.findProgramAddress([
        Buffer.from('token-governance', 'utf-8'),
        realm.toBuffer(),
        tokenAccount.toBuffer(),
    ], programId);
    if (address.equals(owner)) {
        console.log(`Success. The token_account: ${tokenAccount.toBase58()} is owned by a governance PDA`);
    }
    else {
        console.log(`Failure`);
    }
    process.exit(0);
})).argv;
yargs_1.default(helpers_1.hideBin(process.argv)).command('change-perp-market-params <group> <symbol>', 'change params for a perp market', (y) => {
    return y
        .positional(...groupDesc)
        .positional(...symbolDesc)
        .option('maint_leverage', {
        type: 'number',
    })
        .option('init_leverage', {
        type: 'number',
    })
        .option('liquidation_fee', {
        type: 'number',
    })
        .option('maker_fee', {
        type: 'number',
    })
        .option('taker_fee', {
        type: 'number',
    })
        .option('rate', {
        type: 'number',
    })
        .option('max_depth_bps', {
        type: 'number',
    })
        .option('target_period_length', {
        type: 'number',
    })
        .option('mngo_per_period', {
        type: 'number',
    })
        .option(...clusterDesc)
        .option(...configDesc)
        .option(...keypairDesc);
}, (args) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('change-perp-market-params', args);
    const account = readKeypair(args.keypair);
    const config = readConfig(args.config);
    const cluster = args.cluster;
    const connection = openConnection(config, cluster);
    const groupConfig = config.getGroup(cluster, args.group);
    const symbol = args.symbol;
    const client = new client_1.MangoClient(connection, groupConfig.mangoProgramId);
    const mangoGroup = yield client.getMangoGroup(groupConfig.publicKey);
    const perpMarketConfig = utils_1.throwUndefined(config_1.getPerpMarketByBaseSymbol(groupConfig, symbol));
    const perpMarket = yield client.getPerpMarket(perpMarketConfig.publicKey, perpMarketConfig.baseDecimals, perpMarketConfig.quoteDecimals);
    // console.log(perpMarket.liquidityMiningInfo.rate.toString());
    // console.log(perpMarket.liquidityMiningInfo.mngoPerPeriod.toString());
    // console.log(perpMarket.liquidityMiningInfo.mngoLeft.toString());
    // console.log(perpMarket.liquidityMiningInfo.periodStart.toString());
    // console.log(perpMarket.liquidityMiningInfo.targetPeriodLength.toString());
    let mngoPerPeriod = getNumberOrUndef(args, 'mngo_per_period');
    if (mngoPerPeriod !== undefined) {
        const token = config_1.getTokenBySymbol(groupConfig, 'MNGO');
        mngoPerPeriod = utils_1.uiToNative(mngoPerPeriod, token.decimals).toNumber();
    }
    yield client.changePerpMarketParams(mangoGroup, perpMarket, account, getNumberOrUndef(args, 'maint_leverage'), getNumberOrUndef(args, 'init_leverage'), getNumberOrUndef(args, 'liquidation_fee'), getNumberOrUndef(args, 'maker_fee'), getNumberOrUndef(args, 'taker_fee'), getNumberOrUndef(args, 'rate'), getNumberOrUndef(args, 'max_depth_bps'), getNumberOrUndef(args, 'target_period_length'), mngoPerPeriod);
    // await sleep(2000);
    // perpMarket = await client.getPerpMarket(
    //   perpMarketConfig.publicKey,
    //   perpMarketConfig.baseDecimals,
    //   perpMarketConfig.quoteDecimals,
    // );
    // console.log(perpMarket.liquidityMiningInfo.rate.toString());
    // console.log(perpMarket.liquidityMiningInfo.mngoPerPeriod.toString());
    // console.log(perpMarket.liquidityMiningInfo.mngoLeft.toString());
    // console.log(perpMarket.liquidityMiningInfo.periodStart.toString());
    // console.log(perpMarket.liquidityMiningInfo.targetPeriodLength.toString());
    process.exit(0);
})).argv;
function getNumberOrUndef(args, k) {
    return args[k] === undefined ? undefined : args[k];
}
yargs_1.default(helpers_1.hideBin(process.argv)).command('set-admin <group> <admin_pk>', 'transfer admin permissions over group to another account', (y) => {
    return y
        .positional(...groupDesc)
        .positional('admin_pk', {
        describe: 'the public key of the new group admin',
        type: 'string',
    })
        .option(...clusterDesc)
        .option(...configDesc)
        .option(...keypairDesc);
}, (args) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('set-admin', args);
    const account = readKeypair(args.keypair);
    const config = readConfig(args.config);
    const cluster = args.cluster;
    const connection = openConnection(config, cluster);
    const groupConfig = config.getGroup(cluster, args.group);
    const client = new client_1.MangoClient(connection, groupConfig.mangoProgramId);
    const mangoGroup = yield client.getMangoGroup(groupConfig.publicKey);
    yield client.setGroupAdmin(mangoGroup, new web3_js_1.PublicKey(args.admin_pk), account);
    process.exit(0);
})).argv;
//# sourceMappingURL=cli.js.map
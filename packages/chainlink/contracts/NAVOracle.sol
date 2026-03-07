// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title NAVOracle
 * @notice Stores real-time Net Asset Value per cattle lot, calculated by the
 *         Chainlink CRE workflow from Argentine livestock market data.
 *
 * All price values are scaled x100 (2 decimal places stored as integers).
 * Example: beefPrice = 215 means 2.15 USD/kg
 */
contract NAVOracle {
    address public operator;
    address public keystoneForwarder;

    // --- Market prices (same for all lots, updated once per CRE run) ---
    struct MarketPrices {
        int256 beefPrice;   // USD/kg x100  (from SIOCarnes / MAGyP)
        int256 cornPrice;   // USD/ton x100 (from MAGyP FOB export)
        int256 arsUsdRate;  // ARS per USD x100 (e.g. 150000 = 1500.00 ARS/USD)
        uint256 updatedAt;
    }

    MarketPrices public marketPrices;

    // --- Per-lot NAV ---
    struct LotNAV {
        int256 nav;             // Total lot NAV in USD x100
        int256 navPerShare;     // NAV per share in USD x100
        uint32 weightGrams;     // Current total weight of the lot (grams)
        uint256 updatedAt;
    }

    mapping(uint256 => LotNAV) public lotNAV;
    uint256[] public activeLotIds;
    mapping(uint256 => bool) public isActiveLot;

    // --- Events ---
    event MarketPricesUpdated(
        int256 beefPrice,
        int256 cornPrice,
        int256 arsUsdRate,
        uint256 timestamp
    );

    event LotNAVUpdated(
        uint256 indexed lotId,
        int256 nav,
        int256 navPerShare,
        uint32 weightGrams,
        uint256 timestamp
    );

    event WeighingProcessed(
        uint256 indexed lotId,
        uint32 previousWeightGrams,
        uint32 newWeightGrams,
        int256 newNAV,
        uint256 timestamp
    );

    // --- Modifiers ---
    modifier onlyOperator() {
        require(
            msg.sender == operator || msg.sender == address(this),
            "NAVOracle: not operator"
        );
        _;
    }

    modifier onlyForwarder() {
        require(msg.sender == keystoneForwarder, "NAVOracle: not forwarder");
        _;
    }

    constructor(address _keystoneForwarder) {
        operator = msg.sender;
        keystoneForwarder = _keystoneForwarder;
    }

    function setOperator(address _operator) external onlyOperator {
        operator = _operator;
    }

    function setKeystoneForwarder(address _forwarder) external onlyOperator {
        keystoneForwarder = _forwarder;
    }

    function onReport(bytes calldata metadata, bytes calldata report) external onlyForwarder {
        (bool success, bytes memory result) = address(this).call(report);
        require(success, string(result));
    }

    // --- Market prices ---

    function updateMarketPrices(
        int256 _beefPrice,
        int256 _cornPrice,
        int256 _arsUsdRate
    ) external onlyOperator {
        marketPrices = MarketPrices({
            beefPrice: _beefPrice,
            cornPrice: _cornPrice,
            arsUsdRate: _arsUsdRate,
            updatedAt: block.timestamp
        });
        emit MarketPricesUpdated(_beefPrice, _cornPrice, _arsUsdRate, block.timestamp);
    }

    // --- Per-lot NAV: batch update (single tx per CRE run) ---

    function batchUpdateLotNAV(
        uint256[] calldata _lotIds,
        int256[] calldata _navs,
        int256[] calldata _navPerShares,
        uint32[] calldata _weightGrams
    ) external onlyOperator {
        require(
            _lotIds.length == _navs.length &&
            _navs.length == _navPerShares.length &&
            _navPerShares.length == _weightGrams.length,
            "NAVOracle: array length mismatch"
        );

        for (uint256 i = 0; i < _lotIds.length; i++) {
            uint256 lotId = _lotIds[i];
            uint32 previousWeight = lotNAV[lotId].weightGrams;

            lotNAV[lotId] = LotNAV({
                nav: _navs[i],
                navPerShare: _navPerShares[i],
                weightGrams: _weightGrams[i],
                updatedAt: block.timestamp
            });

            // Register as active lot if new
            if (!isActiveLot[lotId]) {
                isActiveLot[lotId] = true;
                activeLotIds.push(lotId);
            }

            emit LotNAVUpdated(lotId, _navs[i], _navPerShares[i], _weightGrams[i], block.timestamp);

            // Emit weighing event if weight changed
            if (previousWeight > 0 && previousWeight != _weightGrams[i]) {
                emit WeighingProcessed(
                    lotId,
                    previousWeight,
                    _weightGrams[i],
                    _navs[i],
                    block.timestamp
                );
            }
        }
    }

    // --- Views ---

    function getLotNAV(uint256 lotId) external view returns (LotNAV memory) {
        return lotNAV[lotId];
    }

    function getMarketPrices() external view returns (MarketPrices memory) {
        return marketPrices;
    }

    function getActiveLotIds() external view returns (uint256[] memory) {
        return activeLotIds;
    }
}

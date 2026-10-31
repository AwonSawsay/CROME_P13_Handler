/*********************************************************************
P13 Handler for CROME
Auth: Damian Badalamenti, Updated by Awon (BiggieSmallBlock on pgmfi)
*********************************************************************
Desc: 
    A script to edit P13 style roms with major improvements over the original.
    Compatible with P11, P12, P13, P14, P39, P51 and possibly other 66911 based
    ECUs.
    !! ONLY TESTED ON ENGINE SIMULATOR USE AT YOUR OWN RISK !!

Requires:
    - updated OptionsPage.html / OptionsPage.js
    - ECUFeatures.html / ECUFeatures.js
    - Boost.js
    - CustomMap.html
    - FuelXpliers.html
    - P13Helper.js
    - P13Addresses.js- P13Datalogger.js
    - TableEditor.html
    - Idle1.html
    - Idle2.html
    - master.css

Features:
    - More accurate fuel table support
    - Full speed datalogger 
    - extended (boost) tables
    - Close loop bypass
    - EGR Disable
    - Knock disable
    - custom MAP sensors
    - expanded fuel adjustment range
    - VTEC on non VTEC ECUs
    - Alternate VTEC outputs
    - IAB / ICS control
    - fuel multipler
    - Compatibility accross multiple 66911 base ECUs
    - ECU Feature and RP Jumper Control
    - Basic viewing and editing of nearly ALL ROM tables
    - and more.

 Changelog:
    -v2.0   - Initial updated release - March 2026

********************************************************************/
// Reference for IDE
/// <reference path="./P13Helper.js" />
/// <reference path="./P13Addresses.js" />

var P13_HANDLER_VERSION = "2.0";

// Fuel values
var MAX_FUEL_BYTE_VALUE = 0xb0;			            // Actual ECU imposed limit on fuel table values - MAX
var MIN_FUEL_BYTE_VALUE = 0x80;			            // Actual ECU imposed limit on fuel table values - MIN
var MAX_FUEL_BYTE_EXTENDED_RANGE = 0xff;            // Byte limit when using larger fuel range patch
var FUEL_DISPLAY_REDUCTION = 0.2500111982082867;    // Friendly display conversion value
var notifiedAlready = false;                        // Indicates if user has already been informed about the fuel boundaries
var continueWarning = true;                         // Does user want to keep receiving cell boundary warnings

//*********************************************************************
// SCALARS
//*********************************************************************

/**Get RPM scalar for a given table and row */
function __P13GetRevScalar(mapType, index) {
    index = index * 2;
    
    // Get RPM scalar table address
    var RPMScalarTableLoc = __P13GetRPMScalarTable(mapType);
    
    // Return RPM
    return 1875000 / rom.wordAt(RPMScalarTableLoc + index) ;

}

/**Set RPM scalar for a given table and row */
function __P13SetRevScalar(mapType, index, value) {
    index = index * 2;

    // Get RPM scalar table address
    var RPMScalarTableLoc = __P13GetRPMScalarTable(mapType);

    // Set RPM scalar value
    rom.wordAt(RPMScalarTableLoc + index) = 1875000 / value;

}

/**Get MAP scalar for a given table and column */
function __P13GetMapScalarInmBar(mapType, index) {
    var mbar0v = rom.addressOf('NFO_MAP_MIN') - 0x8000;
    var mbar5v = rom.addressOf('NFO_MAP_MAX') - 0x8000;

    // Get scalar address
    MAPScalarAddress = __P13GetMAPScalarTableLoc(mapType) + index;

    // Convert offset MAP to mBar
    if (rom.byteAt(address.MAP_USING_OFFSET_SCALARS_LOC) == 0xFF) {
        return P13.map_offsetToMbar(rom.byteAt(MAPScalarAddress));
    }

    // Convert raw high byte to mBar
    return P13.map_rawHighByteTomBar(rom.byteAt(MAPScalarAddress), mbar0v, mbar5v);


}

/**Get MAP scalar in ofset MAP format for a given table and column */
function __P13GetMapScalarInOffset(mapType, column) {
    var rawScalars = false;
    var mbar0v = rom.addressOf('NFO_MAP_MIN') - 0x8000;
    var mbar5v = rom.addressOf('NFO_MAP_MAX') - 0x8000;
    
    // Using raw scalars?
    if (rom.byteAt(address.MAP_USING_OFFSET_SCALARS_LOC) == 0x00){
        rawScalars = true;
    }

    // Get MAP scalar table address
    var MAPScalarTblLoc = __P13GetMAPScalarTableLoc(mapType);

    // Get scalar byte from ROM 
    var scalar = rom.byteAt(MAPScalarTblLoc + column);
    
    // If using RAW scalars, convert to offset, bc thats how the ECU makes its fuel base
    if (rawScalars){
        scalar = P13.map_rawHighByteToOffset(scalar, true, mbar0v, mbar5v);
    }  
    return P13.constrainByte(scalar);
}

/**Set MAP scalar for a given table and column */
function __P13SetMapScalar(mapType, index, value) {
    var mbar0v = rom.addressOf('NFO_MAP_MIN') - 0x8000;
    var mbar5v = rom.addressOf('NFO_MAP_MAX') - 0x8000;

    // Get scalar address
    MAPScalarAddress = __P13GetMAPScalarTableLoc(mapType) + index;

    // Offset MAP 
    if (rom.byteAt(address.MAP_USING_OFFSET_SCALARS_LOC) == 0xFF) {
        rom.byteAt(MAPScalarAddress) = P13.map_mBarToOffset(value);
        return
    }

    // Convert mbar to Raw high byte
    rom.byteAt(MAPScalarAddress) = P13.map_mBarToRawHighByte(value, mbar0v, mbar5v);
   
}

/**Get address of the MAP scalar table for the given table */
function __P13GetMAPScalarTableLoc(mapType){
    // Get high cam MAP scalar table address
    if(mapType == 2 || mapType == 3){
       return rom.addressOf('HIGH_MAP_SCALAR');
    }    
     
    return rom.addressOf('LOW_MAP_SCALAR');
}

/**Get address of the RPM scalar table for the given table */
function __P13GetRPMScalarTable(mapType){
    var RPMScalarTableLoc = 0;
    
    // Get Low cam MAP scalar table address
    if(mapType == 0 || mapType == 3){
        RPMScalarTableLoc = rom.addressOf('LOW_REV_SCALAR');
    }
    
    // Get high cam MAP scalar table address
    if(mapType == 1 || mapType == 4){
        RPMScalarTableLoc = rom.addressOf('HIGH_REV_SCALAR');
    }
    
    return RPMScalarTableLoc;
}

//*********************************************************************
// TABLES MAIN
//*********************************************************************

/**Returns Display friendly values from ROM tables */
function __P13GetTableValue(mapType, col, row) {
    
    // Get table address, data, type
    var table = __P13GetRawTableData(mapType, col, row);
    
    // Convert raw table data to display value 
    if (table.isFuel) {
        return __P13convertFuelTbl(mapType, col, row, table.data, false);
    }

    // Convert raw table data to ignition value
    else {
        return ((table.data - 24) / 4);
    }
    
}

/** Set Table Value */
function __P13SetTableValue(mapType, col, row, value) {
    var lowerBounds = MIN_FUEL_BYTE_VALUE;
    var upperBounds = MAX_FUEL_BYTE_VALUE;
    
    // Patch for using larger fuel range patch
    if(rom.byteAt(address.USE_STOCK_FUEL_RANGE) === 0x00){
        upperBounds = MAX_FUEL_BYTE_EXTENDED_RANGE;
        lowerBounds = MIN_FUEL_BYTE_VALUE / 2;
    }  
    var byteValue;
    
    // Get table information
    var table = __P13GetRawTableData(mapType, col, row);
    
    // Fuel Table
    if(table.isFuel) {
        // Convert displayed fuel value to byte value
        byteValue = __P13convertFuelTbl(mapType, col, row, value, true);
        
        // Adjust boundaries if this is a max load or boost column on boosted ROM(custom ROM code required)
        if(__P13GetMapScalarInOffset(mapType, col) === 0xFF && rom.byteAt(address.TABLES_USING_STANDARD_SIZE) === 0x00){
            lowerBounds = address.MIN_BOOSTED_FUEL_BYTE_VALUE;
            upperBounds = address.MAX_BOOSTED_FUEL_BYTE_VALUE;
        }

        // Byte out of bounds, notify user and adjust value to bouundary
        if (byteValue < lowerBounds || byteValue > upperBounds) {
            byteValue = Math.min(Math.max(byteValue, lowerBounds), upperBounds);
            __boundaryNotify();
            
        }

    }
    
    // Ignition Table
    else{
        byteValue = (value * 4) + 24;
    }
        
    // Write byte value to ROM
    rom.byteAt(table.dataAddress) = P13.constrainByte(byteValue);
}

/** Notify user that boundaries have been met the first time that it happens */
function __boundaryNotify(){
    if(!continueWarning)return;
    if(notifiedAlready){
        continueWarning = confirm("Cell limit exceeded.\n\nKeep receiving warnings?");
        return;
    }
    alert("The P13 has built in limits for the minimum and maximum values allowed in " +
        "any one given cell. You have exceeded these limits in the current cell. " +
        "There a few options to work around this. You can enable \"Force larger fuel table range\" " +
        "in the Options menu to patch out the boundaries and allow a wider fuel range. Or adjust the " +
        "\"Main Fuel Base\" in the options menu to adjust the multipliers for each row individually. And " + 
        "lastly you can adjust the \"Fuel Multiplier\" from the Options page to make a blanket change to the " +
        "fuel base accross the table."
    );
    notifiedAlready = true;
}

/**Return object with table address, no of columns, table value, and true if it's a fuel table */
function __P13GetRawTableData(mapType, col, row) {
    
    var tableColumns = 0
    var tableAddress = 0;
    var tableDataAddress = 0;
    var tableData = 0;
    var isFuel = false;

    // Get Table dimensions from ROM 
    tableColumns = P13.getTableSize().width;
    
   
    // Select table address by type
    switch (mapType) {
        case 0:
            tableAddress = rom.addressOf('LOW_FUEL');
            isFuel = true;
            break;
        case 1:
            tableAddress = rom.addressOf('HIGH_FUEL');
            isFuel = true;
            break;
        case 2:
            tableAddress = rom.addressOf('LOW_IGNITION');
            break;
        case 3:
            tableAddress = rom.addressOf('HIGH_IGNITION');
            break;
        default:
            throw new Error("Invalid table type: " + mapType);
            break;
    }
    // Get Data from table
    var tableOffset = col + (row * tableColumns);
    tableDataAddress = tableAddress + tableOffset;
    tableData = rom.byteAt(tableDataAddress);
    
    return {address: tableAddress, 
            columns: tableColumns,
            dataAddress: tableDataAddress, 
            data: tableData,  
            isFuel: isFuel};
            
}

//*********************************************************************
// FUEL BASE AND MULTIPLIERS
//*********************************************************************

/** Returns the main fuel base and it's components using table information*/
function __P13GetMainFuelBase(mapType, column, row) {
    
    // Get fuel base values
    var MAPcolumnValue = __getMAPScalarWithMIN(mapType, column);
    var fuelBaseValues = __GetMainFuelBaseXplierAndAddon(mapType, row);
   
    // Create main fuel base value
    var fuelBase = __calculateMainFuelBase(fuelBaseValues.MAPMultiplier, fuelBaseValues.rowAddon, MAPcolumnValue);
    
    // Apply custom multiplier if applicable
    var customXplier = P13.getCustomXplierValue();
    var fuelBaseWithCustomXplier = P13.applyTrimValue(fuelBase , customXplier , 0x200);
    
    //return fuelBaseWithCustomXplier;
    return {
        fuelBase: fuelBaseWithCustomXplier,
        customXplier: customXplier,
        MAPXplier: fuelBaseValues.MAPMultiplier,
        rowAddon: fuelBaseValues.rowAddon,
        MAPColumnValue: MAPcolumnValue
    };

}

/**Returns object with MAP Multiplier and row Addon
 *These make up the main fuel value that the "fuel tables" trim */
function __GetMainFuelBaseXplierAndAddon(mapType, row) {
    
    // Return if not fuel table
    if (mapType > 1) return;

    // Low cam map
    var TblXplier = address.TBL_LOW_CAM_ROW_XPLIER_LOC;
    var TblAddon = address.TBL_LOW_CAM_FUEL_ADDON_LOC;

    // High cam map
    if (mapType == 1) {
        TblXplier = address.TBL_HI_CAM_ROW_XPLIER_LOC;
        TblAddon = address.TBL_HI_CAM_FUEL_ADDON_LOC;
    }

    // Get and return values from multipler and addon tables
    var MAPMultiplier = rom.byteAt(TblXplier + row);
    var rowAddon = rom.byteAt(TblAddon + row);
    return {MAPMultiplier: MAPMultiplier, rowAddon: rowAddon};

}

/**Sets MAP Multiplier and row Addon
 *These make up the main fuel value that the "fuel tables" trim */
function __SetMainFuelBaseXplierAndAddon(mapType, row, xplier, addon) {
    
    // Return if not fuel table
    if (mapType > 1) return;

    // Low cam map
    var TblXplier = address.TBL_LOW_CAM_ROW_XPLIER_LOC;
    var TblAddon = address.TBL_LOW_CAM_FUEL_ADDON_LOC;

    // High cam map
    if (mapType == 1) {
        TblXplier = address.TBL_HI_CAM_ROW_XPLIER_LOC;
        TblAddon = address.TBL_HI_CAM_FUEL_ADDON_LOC;
    }

    // Set and return values from multipler and addon tables
    rom.byteAt(TblXplier + row) = xplier;
    rom.byteAt(TblAddon + row) = addon;

}

//*********************************************************************
// HELPER FUNCTIONS
//*********************************************************************
/** Get version info fand set title bar string */
function __getTitleString(){
    //var titleStr = 'P13 ROM -- Handler: v'+ P13_HANDLER_VERSION +' -- P13Addresses: v' + P13_ADDRESSES_VERSION + ' -- P13Helper: v' + P13_HELPER_VERSION + ' -- Boost: ' + P13_BOOST_HANDLER_VERSION;
    var titleStr = "!!! BETA P13 HANDLER USE AT YOUR OWN RISK !! Handler: v" + P13_RELEASE_VERSION;
    
    // Display ROM version if avail, display with * if rom has received a version upgrade
    var romReleaseVersion = null;
    if(rom.wordAt(address.HANDLER_RELEASE_VERSION_LOC) !== 0xffff){
        romReleaseVersion = (function(v){return ("0"+((v>>8)&255)).slice(-2)+"."+("0"+(v&255)).slice(-2);})(rom.wordAt(address.HANDLER_RELEASE_VERSION_LOC));
    }
    var star = ""
    if(rom.wordAt(address.HANDLER_RELEASE_PREV_VERSION_LOC) !== 0xffff) star = "*"
    if (romReleaseVersion !== null) titleStr += " --- ROM: " + star + "v" + romReleaseVersion;
    return titleStr;
}

/** Gather and display all plugin versions */
function p13ShowVersion(){
    P13.showVersion();
}

/**Convert final fuel and back using table information */
function __P13convertFuelTbl(mapType, col, row, value, toByte) {
    
    var convertedValue = 0;

    // Get main fuel base and components
    var mainFuelBase = __P13GetMainFuelBase(mapType, col, row);


    // Convert Value
    convertedValue = __P13convertFuelRaw(mainFuelBase.MAPXplier, mainFuelBase.rowAddon, value, mainFuelBase.MAPColumnValue, toByte );
    return convertedValue;
}

/**Calculate final fuel and back to byte using raw values */
function __P13convertFuelRaw(Xplier, Addon, tableValue, MAPScalar, toByte ) {

    // Patch for using larger fuel range patch
    var shiftBase = 7;
    if(rom.byteAt(address.USE_STOCK_FUEL_RANGE) === 0x00){
        shiftBase = 6;
    }  
    
    
    toByte = (toByte === undefined) ? false : toByte;
    // Valid input check
    if (tableValue === null || MAPScalar === null) {
        return NaN; 
    }
    
    // Main fuel base
    var fuelBase = __calculateMainFuelBase(Xplier, Addon, MAPScalar);
        
    // Fuel base with patched multiplier
    var fuelBaseWithCustomXplier = P13.applyTrimValue(fuelBase , P13.getCustomXplierValue() , 0x200);
    
    // Final fuel after table trim and display adjustment
    var calculatedValue = ((fuelBaseWithCustomXplier * tableValue) >> shiftBase) * FUEL_DISPLAY_REDUCTION;
    
    // Convert displayed fuel value to byte value
    if(toByte){
        calculatedValue = Math.round(((tableValue / FUEL_DISPLAY_REDUCTION) << shiftBase) / fuelBaseWithCustomXplier);
        value = Math.max(0, Math.min(255, Math.floor(calculatedValue)));
    }
    
    return calculatedValue;
}

/** Returns MAP value for current column with a minimum boundary for fuel base */
function __getMAPScalarWithMIN(mapType, column) {
    var MIN_MAP_VALUE = 0x18;  // Citation needed for the necessity of this
 
    // Return if not fuel table
    if (mapType > 1) return;

    scalar = __P13GetMapScalarInOffset(mapType, column);
    //return Math.max(MIN_MAP_VALUE, scalar);
    return scalar;
}


/**Calculate main fuel base from MAP multiplier, addon, and MAP value */
function __calculateMainFuelBase(MAPMultiplier, Addon, MAPValue){
    return Math.max(0x00, ((MAPMultiplier * MAPValue) >> 4) + ((Addon - 128) << 1));
}

//****************************************************************************
//****************************************************************************
// Options Page!!
//****************************************************************************
// Show Custom Options
// This is triggered when the user clicks on 'Options'
// It's preferred to load an html based custom options page here
function __P13DoShowOptions() {
    showBrowser('handlers\\P13_Options\\OptionsPage.html', 670, 675, resizable=true);
    refresh();
}
//****************************************************************************


//****************************************************************************
// By Assigning the event hooks when a ROM is loaded, it is less
// likely that any event hooks will be called for the wrong ROM type
// ** All event hooks are first cleared when a new ROM is loaded

function __P13EventHooks() {

    rom.base = rtP13;
    rom.title = __getTitleString(); 
    rom.hasIAB = 1;
    rom.events.OnGetMapScalar = '__P13GetMapScalarInmBar';
    rom.events.OnSetMapScalar = '__P13SetMapScalar';
    rom.events.OnGetRevScalar = '__P13GetRevScalar';
    rom.events.OnSetRevScalar = '__P13SetRevScalar';
    rom.events.OnGetTableValue = '__P13GetTableValue';
    rom.events.OnSetTableValue = '__P13SetTableValue';
    events.OnShowOptions = '__P13DoShowOptions';
    address.DefineAddresses();
    notifiedAlready = false;

    // Checksum disable and ECU compatibility are on by default: apply both when neither is present
    P13.applyDefaultPatchesOnOpen();

}
include('handlers\\P13_Options\\P13Helper.js');                  // P13 helper functions 
include('handlers\\P13_Options\\P13Addresses.js');               // P13 Addresses
include('handlers\\P13_Options\\P13Datalogger.js');              // P13 Datalogger plugin
include('handlers\\P13_Options\\Boost.js');                      // P13 Boost handler

addRomHandler(rtP13, 'Awon', '__P13EventHooks()');



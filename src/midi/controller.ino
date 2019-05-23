/*********************************************************************
 This is an example for our nRF52 based Bluefruit LE modules

 Pick one up today in the adafruit shop!

 Adafruit invests time and resources providing this open source code,
 please support Adafruit and open-source hardware by purchasing
 products from Adafruit!

 MIT license, check LICENSE for more information
 All text above, and the splash screen below must be included in
 any redistribution



button layout:

7, MCP 7, MCP 5, MCP6
11, 20, 8, 14
30, 28, 16, 15
27, 29, 12, 13

mcp 4
mcp 3
map 2
mcp 1
mcp 0

*********************************************************************/

#include <bluefruit.h>
#include <MIDI.h>

#include <Wire.h>
#include "Adafruit_MCP23008.h"
Adafruit_MCP23008 mcp;
//#include "Adafruit_MCP23017.h"
//Adafruit_MCP23017 mcp;

// BLE Service
BLEDis  bledis;  // device information
BLEBas  blebas;  // battery
BLEMidi blemidi; // midi

//MIDI_CREATE_BLE_INSTANCE(blemidi);
MIDI_CREATE_DEFAULT_INSTANCE();

const int pots[] = {PIN_A0, PIN_A1, PIN_A2, PIN_A3}; 
//float mv_per_lsb = 3600.0F/1024.0F; // 10-bit ADC with 3.6V input range

const int pins[] = {28, 29, 12, 13, 14, 8, 20, 16, 15, 7, 11, 30, 27};
int states1[] = {0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0};
const int notes1[] = {69, 73, 74, 75, 67, 66, 65, 70, 71, 60, 64, 68, 72};

const int pinsmcp[] = {0, 1, 2, 3, 4, 5, 6, 7};
int states2[] = {0, 0, 0, 0, 0, 0, 0, 0};
const int notes2[] = {0, 1, 2, 3, 4, 62, 63, 61};

#define TOLERANCE 5
int oldPotVal = 0;

/*
byte note_sequence[] = {
  74,78,81,86,90,93,98,102,57,61,66,69,73,78,81,85,88,92,97,100,97,92,88,85,81,78,
  74,69,66,62,57,62,66,69,74,78,81,86,90,93,97,102,97,93,90,85,81,78,73,68,64,61,
  56,61,64,68,74,78,81,86,90,93,98,102
};
*/

void setup()
{
  Serial.begin(115200);
  while ( !Serial ) delay(10);   // for nrf52840 with native usb

  //analogReference(AR_INTERNAL);
  //analogReadResolution(14);
  //pinMode(btnPin, INPUT_PULLUP);

  for (int thisPin = 0; thisPin < 13; thisPin++) {
    pinMode(pins[thisPin], INPUT_PULLUP);
  }
  
  mcp.begin();      // use default address 0
  for (int thisPin = 0; thisPin < 8; thisPin++) {
    mcp.pinMode(pinsmcp[thisPin], INPUT);
    mcp.pullUp(pinsmcp[thisPin], HIGH);  // turn on a 100K pullup internally
  }

  Serial.println("Adafruit Bluefruit52 MIDI over Bluetooth LE Example");
 
  // Config the peripheral connection with maximum bandwidth
  Bluefruit.configPrphBandwidth(BANDWIDTH_MAX);
 
  Bluefruit.begin();
  Bluefruit.setName("Bluefruit52 MIDI");
  Bluefruit.setTxPower(4);
 
  // Setup the on board blue LED to be enabled on CONNECT
  Bluefruit.autoConnLed(true);
 
  // Configure and Start Device Information Service
  bledis.setManufacturer("Adafruit Industries");
  bledis.setModel("Bluefruit Feather52");
  bledis.begin();
 
  // Initialize MIDI, and listen to all MIDI channels, will also call blemidi service's begin()
  MIDI.begin(MIDI_CHANNEL_OMNI);
 
  // Attach the handleNoteOn function to the MIDI Library. It will
  // be called whenever the Bluefruit receives MIDI Note On messages.
  //MIDI.setHandleNoteOn(handleNoteOn);
 
  // Do the same for MIDI Note Off messages.
  //MIDI.setHandleNoteOff(handleNoteOff);
 
  // Set up and start advertising
  startAdv();
 
  // Start MIDI read loop
  //Scheduler.startLoop(midiRead);
}
 
void startAdv(void){
  Serial.print("START ADVERTISING");
  
  // Set General Discoverable Mode flag
  Bluefruit.Advertising.addFlags(BLE_GAP_ADV_FLAGS_LE_ONLY_GENERAL_DISC_MODE);
 
  // Advertise TX Power
  Bluefruit.Advertising.addTxPower();
 
  // Advertise BLE MIDI Service
  Bluefruit.Advertising.addService(blemidi);
 
  // Secondary Scan Response packet (optional)
  Bluefruit.ScanResponse.addName();
 
  //Start Advertising
  Bluefruit.Advertising.restartOnDisconnect(true);
  Bluefruit.Advertising.setInterval(32, 244);    // in unit of 0.625 ms
  Bluefruit.Advertising.setFastTimeout(30);      // number of seconds in fast mode
  Bluefruit.Advertising.start(0);                // 0 = Don't stop advertising after n seconds
}

void handleNoteOn(byte channel, byte pitch, byte velocity){
  // Log when a note is pressed.
  Serial.printf("Note on: channel = %d, pitch = %d, velocity - %d", channel, pitch, velocity);
  Serial.println();
}
 
void handleNoteOff(byte channel, byte pitch, byte velocity){
  // Log when a note is released.
  Serial.printf("Note off: channel = %d, pitch = %d, velocity - %d", channel, pitch, velocity);
  Serial.println();
}

void loop()
{

  //Serial.println(Bluefruit.connected());
  //Serial.println(blemidi.notifyEnabled());
  /*
  if (! Bluefruit.connected()) {
    return;
  }
  
  // Don't continue if the connected device isn't ready to receive messages.
  if (! blemidi.notifyEnabled()) {
    return;
  }
  */
  int note = 60;
  for (int thisPin = 0; thisPin < 13; thisPin++) {
    if(digitalRead(pins[thisPin]) == LOW){
      
      if(states1[thisPin] == 0){
        MIDI.sendNoteOn(notes1[thisPin], 127, 1);

        states1[thisPin] = 1;
        //Serial.print("ON");
        //Serial.println(pins[thisPin]);
      }
    }
    else{
      if(states1[thisPin] == 1){
        MIDI.sendNoteOff(notes1[thisPin], 0, 1);

        states1[thisPin] = 0;
        //Serial.print("OFF");
        //Serial.println(pins[thisPin]);
      }
    }
  }
  
  for (int thisPin = 0; thisPin < 8; thisPin++) {
    if(mcp.digitalRead(pinsmcp[thisPin]) == LOW){
      if(states2[thisPin] == 0){
        MIDI.sendNoteOn(notes2[thisPin], 127, 1);
        
        states2[thisPin] = 1;
        //Serial.print("MCP ON");
        //Serial.println(pinsmcp[thisPin]);
      }
    }
    else{
      if(states2[thisPin] == 1){
        MIDI.sendNoteOff(notes2[thisPin], 0, 1);
        
        states2[thisPin] = 0;
        //Serial.print("MCP OFF");
        //Serial.println(pinsmcp[thisPin]);
      }
    }
  }
  
  /*
  //btnState = mcp.digitalRead(0);
  //btnState = digitalRead(btnPin);
  if (btnState == LOW) {
    //Serial.println(btnState);
  } else {
    //Serial.println(btnState);
  }
  */
  
  int potVal = map(analogRead(pots[0]), 0, 940, 0, 127);
  //MIDI.sendControlChange(1, potVal, 1);
  //int potVal = analogRead(pots[1]);
  //Serial.println(potVal);
  //Serial.print(" [");
  //Serial.print((float)potVal * mv_per_lsb);
  //Serial.println(" mV]");

  delay(25);
  
  int diff = abs(potVal - oldPotVal);
  
  if(diff > TOLERANCE)
  {
      oldPotVal = potVal; // only save if the val has changed enough to avoid slowly drifting
      MIDI.sendControlChange(1, potVal, 1);
  }     
  

  //delay(25);
}


void midiRead(){
  
  // Don't continue if we aren't connected.
  
  if (! Bluefruit.connected()) {
    return;
  }
 
  // Don't continue if the connected device isn't ready to receive messages.
  if (! blemidi.notifyEnabled()) {
    return;
  }
  
  // read any new MIDI messages
  MIDI.read();
}
import React, { useRef,useState, useEffect } from 'react';

import "./RealValueVisualisation.css";

import NavigationBar from "../../components/navigation/Navigation";
import ResultContainer from "../SimulationPage/components/ResultContainer";

import SimulationCanvas from "../SimulationPage/components/SimulationCanvas";

import whiteimage from "../images/white.png";
import MotorNode from "../images/MotorNode.png"; 
import WaterLevelNode from "../images/WaterLevelNode.png";
import WaterQualityNode from "../images/WaterQualityNode.png";
import WaterQuantityNode from "../images/WaterQuantityNode.png";
import config from '../../config';
import zIndex from '@mui/material/styles/zIndex';


const RealValueVisualisation = () => {
  // State for holding input values and results
  const iconRefs = [];
  const [flow1, setFlow1] = useState(false);
  const [flow2, setFlow2] = useState(false);
  const [flow3, setFlow3] = useState(false);
  const [flow4, setFlow4] = useState(false);
  const [flow5, setFlow5] = useState(false);
  const [flow6, setFlow6] = useState(false);
  const [flow7, setFlow7] = useState(false);
  const [flow8, setFlow8] = useState(false);
  const [flow9, setFlow9] = useState(false);

  const [sensorValues, setSensorValues] = useState({
    KRBSump: 0,
    KRBOHTIcon: 0,
    KRBROOHT: 0,
  });

  const [units, setUnits] = useState ({
    flowrate : "Kl/min",
    totalflow: "Kl",
    waterlevel : "cm",
    temparature : "°C",
    temperature: "°C",
    status : "ON(1)/OFF(0)",
    voltage : "V",
    current	: "A",
    power	: "W",
    energy	: "kWh",
    frequency  : "Hz",
    power_factor : "n/a",
    uncompensated_tds: "ppm",
    compensated_tds: "ppm",
    turbudity: "NTU",
    ph: "pH",
  });

  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  const [waterInSump, setWaterInSump] = useState(60000); // Initial water level in Sump
  const [waterInOHT, setWaterInOHT] = useState(0); // Initial water level in OHT
  const [motorOn, setMotorOn] = useState(false); // Initial motor state
  const [waterInROFilter, setWaterInROFilter] = useState(465.32); // Initial water level in RO Filter
  const [waterConsumed, setWaterConsumed] = useState(0);
  const [flowrate, setFlowrate] = useState(10);


  // All measurements are in m(meters)
  const [sumpMeasurements, setSumpMeasurements] = useState({length: 5,breadth: 6.5, height: 2.08});
  const [ohtMeasurements, setOhtMeasurements] = useState({length: 11.28,breadth: 8.82, height: 1.15});


  const WaterLevelCalculate = async (waterlevel, length, breadth, height) => {
    const WaterPercentage = (((height * 100) - waterlevel) / (height * 100)) * 100;
    const EstimatedWaterCapacity = (length * breadth * height * 1000) * (WaterPercentage / 100);
    return [WaterPercentage, EstimatedWaterCapacity]; // Return values inside an array
  };
  
  const MotorFlow = async (voltage, current, power_factor, motor_efficiency, depth, status) => {
    const power_input = voltage * current * (1.73205080757) * power_factor; // 1.73205080757 is sqrt(3), considering 3 phase motor
    const p_mechanical = power_input * motor_efficiency;
    const p_hydraulic = p_mechanical;
    const flowrate = p_hydraulic / (1000 * 9.81 * depth);
    const flowrate_lpm = flowrate * 1000 * status;
    return flowrate_lpm;
  }

  const fetchNodeData = async (tableName) => {
    console.log("Fetching data for", tableName);
    try {
      const jsonData = await getRealData(tableName);
      if (typeof jsonData !== 'object' || jsonData === null) {
        console.log("No valid data available for", tableName);
        return; // Exit the function if no valid data is available
      }
      // Create a table element
      const table = document.createElement('table');
      // Create table header row
      const headerRow = document.createElement('tr');
      // Create table header cells
      const headers = ['Parameter', 'Value', 'Units']; // Modify the headers here
      // Add styles to the table
      table.style.width = '100%';
      table.style.borderCollapse = 'collapse';
      // Add styles to table headers
      headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        th.style.border = '1px solid black';
        th.style.padding = '8px';
        th.style.backgroundColor = '#f2f2f2'; // Example background color for headers
        headerRow.appendChild(th);
      });
      table.appendChild(headerRow); // Append the header row to the table

      // Similarly, add styles to cells in the body
      Object.entries(jsonData).forEach(([key, value]) => {
        if (key === 'timestamp') {
          return; // Skip the key 'timestamp'
        }
        const row = document.createElement('tr');
        const keyCell = document.createElement('td');
        keyCell.textContent = key;
        keyCell.style.border = '1px solid black';
        keyCell.style.padding = '8px';
        const valueCell = document.createElement('td');
        if (key === 'creationtime' && value !== null) {
          value = value.replace('+00:00', '+05:30'); // Replace the timezone offset only if value is not null
        }
        valueCell.textContent = value;
        valueCell.style.border = '1px solid black';
        valueCell.style.padding = '8px';
        const unitCell = document.createElement('td');
        unitCell.textContent = units[key] || ''; // Get the unit from the units object, or leave it empty if not found
        unitCell.style.border = '1px solid black';
        unitCell.style.padding = '8px';
        row.appendChild(keyCell);
        row.appendChild(valueCell);
        row.appendChild(unitCell);
        table.appendChild(row);
      });
      // Display the table in a suitable container or console.log for debugging
      console.log(table.outerHTML); // For debugging, replace with your actual display logic
      const tableContainer = document.getElementById("tableContainer"); // Get the table container element
      tableContainer.innerHTML = ""; // Clear the table container
      tableContainer.appendChild(table); // Append the table to the table container
      const modal = document.getElementById("myModal"); // Get the modal element
      modal.style.display = "block"; // Show the modal after fetching and displaying the data
    } catch (error) {
      console.error(error);
    }
  };

  const closeModal = () => {
    const modal = document.getElementById("myModal");
    modal.style.display = "none";
  };

  const toggleIsOn = (valve) => {};
  const handleIconClick = (icon) => {};


  useEffect(() => {
    setFlow2(true);
    setFlow3(true);
    setFlow5(true);
    setFlow8(true);
    const fetchData = async () => {
      // Calculate Water in Sump
      const SumpWaterLevelData = await getRealData('WM-WL-KH98-00');
      const [SumpWaterPercentage, SumpEstimatedWaterCapacity] = await WaterLevelCalculate((SumpWaterLevelData.waterlevel-20), sumpMeasurements.length, sumpMeasurements.breadth, sumpMeasurements.height);
      setWaterInSump(SumpEstimatedWaterCapacity);

      const RO1FlowData = await getRealData('WM-WF-KB04-71');
      const RO2FlowData = await getRealData('WM-WF-KB04-72');
      setWaterConsumed((RO1FlowData.totalflow + RO2FlowData.totalflow)*1000); //Converting to Litres from Kl

      // Calculate Water in OHT
      const OHTWaterLevelData = await getRealData('WM-WL-KH00-00');
      const [OHTWaterPercentage, OHTEstimatedWaterCapacity] = await WaterLevelCalculate(OHTWaterLevelData.waterlevel, ohtMeasurements.length, ohtMeasurements.breadth, ohtMeasurements.height);
      setWaterInOHT(OHTEstimatedWaterCapacity);

      // Calculate Motor Running Status
      const MotorData = await getRealData('DM-KH98-60');
      const MotorFlowrate = await MotorFlow(MotorData.voltage, MotorData.current, MotorData.power_factor, 0.85, sumpMeasurements.height, MotorData.status);
      setMotorOn(MotorData.status === 1 ? true : false);
      setFlow4(MotorData.status === 1 ? true : false);
      console.log("Motor FlowRate", MotorFlowrate);

      // WaterQuantityNode Data 
      const WaterQuantityDataAW1 = await getRealData('WM-WF-KB04-70');
      const WaterQuantityDataKW2 = await getRealData('WM-WF-KB04-73');
      const WaterQuantityDataR1 = await getRealData('WM-WF-KB04-71');
      const WaterQuantityDataR2 = await getRealData('WM-WF-KB04-72');
      const WaterQuantityBorewelltoSump = await getRealData('WM-WF-KH98-40');
      console.log("WaterQuantityBorewelltoSump", WaterQuantityBorewelltoSump)
      const WaterQuantityMotortoOHT = await getRealData('WM-WF-KH95-40');
      if (WaterQuantityDataAW1.flowrate > 0) {setFlow6(true);} else {setFlow6(false);}
      if (WaterQuantityDataKW2.flowrate > 0) {setFlow7(true);} else {setFlow7(false);}
      if (WaterQuantityDataR1.flowrate > 0) {setFlow8(true);} else {setFlow8(false);}
      if (WaterQuantityDataR2.flowrate > 0) {setFlow9(true);} else {setFlow9(false);}
      if (WaterQuantityBorewelltoSump.flowrate > 0) {setFlow1(true);} else {setFlow1(false);}
      // if (WaterQuantityMotortoOHT.flowrate > 0) {setFlow4(true);} else {setFlow4(false);}

    };

    fetchData();

    const interval = setInterval(() => {
      fetchData();
    }, 120000); // Run every 2 minutes

    return () => clearInterval(interval);
  }, []);


  // const ResultCard = React.forwardRef(({ title, value }, ref) => {
  //   return (
  //     <div ref={ref} className="result-card">
  //       <h5>{title}</h5>
  //       <p>{value}</p>
  //     </div>
  //   );
  // });

  const getRealData = async (tableName) => {
    try {
      const response = await fetch(`${config.backendAPI}/get_value?table_name=${tableName}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json(); // Assuming this returns an object
      // console.log(data);
      return data;
    } catch (error) {
      console.error("Fetch error:", error);
      return { error: "Failed to fetch data" }; // Update accordingly
    }
  };

  const Box = ({ color, src }) => (
    <div style={{
      flex: 1,
      backgroundColor: color,
      margin: '-20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <iframe src={src} width="290vw" height="100%" style={{ border: 'none' }}></iframe>
    </div>
  );

  function InteractiveIcon({ src, alt, onClick, fetchNodeDataParam }) {
    const iconStyle = {
      width: "2vw",
      height: "2vw",
      transition: "transform 0.3s, filter 0.3s", // Smooth transition for transform and filter
      zIndex:10,
      cursor: "pointer" // Change cursor to indicate it's clickable
    };
  
    const handleMouseOver = (e) => {
      e.currentTarget.style.transform = "scale(1.2)"; // Zoom effect
      e.currentTarget.style.filter = "brightness(0.5)"; // Change color effect
    };
  
    const handleMouseOut = (e) => {
      e.currentTarget.style.transform = "scale(1)"; // Return to normal size
      e.currentTarget.style.filter = "none"; // Remove color change effect
    };
  
    return (
      <div style={{ position: "absolute"}}>
        <img
          src={src}
          alt={alt}
          style={iconStyle}
          onClick={() => onClick(fetchNodeDataParam)}
          onMouseOver={handleMouseOver}
          onMouseOut={handleMouseOut}
        />
      </div>
    );
  }


  return (
    <div className='page'>
      <NavigationBar title="Digital Twin for Water Quality " style={{position:'fixed'}} />
      <div style={{ display: "flex"}} className='Page'>
      <div style={{ display: 'flex',flex:1, flexDirection: 'column', height: '45vw', border: "0px" }}>
      <Box src="https://smartcitylivinglab.iiit.ac.in/grafana/d/c9998c83-4255-4c0d-ad26-524b8b84272d/zf-digital-twin?orgId=1&kiosk&autofitpanels&theme=light&viewPanel=17" />
      <Box src="https://smartcitylivinglab.iiit.ac.in/grafana/d/c9998c83-4255-4c0d-ad26-524b8b84272d/zf-digital-twin?orgId=1&kiosk&autofitpanels&theme=light&viewPanel=9" />
      <Box src="https://smartcitylivinglab.iiit.ac.in/grafana/d/c9998c83-4255-4c0d-ad26-524b8b84272d/zf-digital-twin?orgId=1&kiosk&autofitpanels&theme=light&viewPanel=24" />
      <Box src="https://smartcitylivinglab.iiit.ac.in/grafana/d/c9998c83-4255-4c0d-ad26-524b8b84272d/zf-digital-twin?orgId=1&kiosk&autofitpanels&theme=light&viewPanel=20" />
    </div>
      <div style={{ height: "45vw", width: "60vw",display: "flex", flex:3, justifyContent: "center", alignItems: "center"}} className='canvas'>
        <div>
          <div>
          <div id="myModal" className="modal" style={{
              position: 'fixed', // Keeps the modal above all other content
              top: '50%', // Centers vertically
              left: '50%', // Centers horizontally
              transform: 'translate(-50%, -50%)', // Adjusts for the modal's dimensions
              width: '60vw',
              zIndex: 1000, // Ensures it's on top of everything
              }}>
            <div className="modal-content">
              <span className="close" onClick={() => closeModal()}>&times;</span>
              <div id="tableContainer"></div>
            </div>
          </div>
            <div style={{ position: 'relative', width: '60vw',height: '20vw',border: '',}}>
              <SimulationCanvas
                handleIconClick={handleIconClick}
                iconRefs={iconRefs}
                flow1={flow1}
                flow2={flow2}
                flow3={flow3}
                flow4={flow4}
                flow5={flow5}
                flow6={flow6}
                flow7={flow7}
                flow8={flow8}
                flow9={flow9}
                setFlow1={setFlow1}
                setFlow2={setFlow2} 
                waterInSump={waterInSump}
                sumpCapacity={sumpMeasurements.length * sumpMeasurements.breadth * sumpMeasurements.height*1000}
                waterInOHT={waterInOHT}
                ohtCapacity={ohtMeasurements.length * ohtMeasurements.breadth * ohtMeasurements.height*1000}
                waterInROFilter={waterInROFilter}
                toggleIsOn={toggleIsOn}
                motorOn={motorOn}
                isSimulationRunning={isSimulationRunning}  
                waterConsumed={waterConsumed}
                flowrate={flowrate}
              />
              {/* IoT Nodes  */}
              <div style={{ position: "absolute", top: "12.5vw", left: "14vw", textAlign: "center" }}>
                {/* <img src={WaterQualityNode} alt="WaterQuality Node" style={{ width: "2vw", height: "2vw" }} onClick={() => fetchNodeData('WM-WD-KH98-00')} /> */}
                <InteractiveIcon src={WaterQualityNode} alt="WaterQuantityNode" onClick={fetchNodeData} fetchNodeDataParam='WM-WD-KH98-00'/>
              </div>

              <div style={{ position: "absolute", top: "2vw", left: "30vw", textAlign: "center" }}>
                {/* <img src={WaterQualityNode} alt="WaterQuality Node" style={{ width: "2vw", height: "2vw", zIndex:5 }} onClick={()=> fetchNodeData('WM-WD-KH96-00')} /> */}
                <InteractiveIcon src={WaterQualityNode} alt="WaterQuantityNode" onClick={fetchNodeData} fetchNodeDataParam='WM-WD-KH96-00'/>
              </div>

              <div style={{ position: "absolute", top: "6.5vw", left: "50.6vw", textAlign: "center" }}>
                {/* <img src={WaterQualityNode} alt="WaterQuality Node" style={{ width: "2vw", height: "2vw" }} onClick={()=> fetchNodeData('WM-WD-KH96-01')} /> */}
                <InteractiveIcon src={WaterQualityNode} alt="WaterQuantityNode" onClick={fetchNodeData} fetchNodeDataParam='WM-WD-KH96-01'/>
              </div>

              <div style={{ position: "absolute", top: "8vw", left: "55vw", textAlign: "center" }}>
                {/* <img src={WaterQualityNode} alt="WaterQuality Node" style={{ width: "2vw", height: "2vw" }} onClick={()=> fetchNodeData('WM-WD-KH96-02')} /> */}
                <InteractiveIcon src={WaterQualityNode} alt="WaterQuantityNode" onClick={fetchNodeData} fetchNodeDataParam='WM-WD-KH96-02'/>
              </div>

              <div style={{ position: "absolute", top: "15vw", left: "52.3vw", textAlign: "center" }}>
                {/* <img src={WaterQualityNode} alt="WaterQuality Node" style={{ width: "1.5vw", height: "1.5vw" }} onClick={()=> fetchNodeData('WM-WD-KH95-00')} /> */}
                <InteractiveIcon src={WaterQualityNode} alt="WaterQuantityNode" onClick={fetchNodeData} fetchNodeDataParam='WM-WD-KH95-00'/>
              </div>

              <div style={{ position: "absolute", top: "15vw", left: "57.9vw", textAlign: "center" }}>
                {/* <img src={WaterQualityNode} alt="WaterQuality Node" style={{ width: "1.5vw", height: "1.5vw" }} onClick={()=> fetchNodeData('WM-WD-KH03-00')} /> */}
                <InteractiveIcon src={WaterQualityNode} alt="WaterQuantityNode" onClick={fetchNodeData} fetchNodeDataParam='WM-WD-KH03-00'/>
              </div>

              <div style={{ position: "absolute", top: "8vw", left: "14vw", textAlign: "center" }}>
                {/* <img src={WaterLevelNode} alt="WaterLevelNode" style={{ width: "2vw", height: "2vw" }} onClick={()=> fetchNodeData('WM-WL-KH98-00')} /> */}
                <InteractiveIcon src={WaterLevelNode} alt="WaterQuantityNode" onClick={fetchNodeData} fetchNodeDataParam='WM-WL-KH98-00'/>
              </div>

              <div style={{ position: "absolute", top: "2vw", left: "33vw", textAlign: "center" }}>
                {/* <img src={WaterLevelNode} alt="WaterLevelNode" style={{ width: "2vw", height: "2vw" }} onClick={()=> fetchNodeData('WM-WL-KH00-00')} /> */}
                <InteractiveIcon src={WaterLevelNode} alt="WaterQuantityNode" onClick={fetchNodeData} fetchNodeDataParam='WM-WL-KH00-00'/>
              </div>

              <div style={{ position: "absolute", top: "10vw", left: "22vw", textAlign: "center", zIndex: 2 }}>
                {/* <img src={MotorNode} alt="MotorNode" style={{ width: "2vw", height: "2vw" }} onClick={()=> fetchNodeData('DM-KH98-60')} /> */}
                <InteractiveIcon src={MotorNode} alt="WaterQuantityNode" onClick={fetchNodeData} fetchNodeDataParam='DM-KH98-60'/>
              </div>

              <div style={{ position: "absolute", top: "7vw", left: "9vw", textAlign: "center",transform: "rotate(90deg)", zIndex: 2 }}>
                {/* <img src={WaterQuantityNode} alt="WaterQuantityNode" style={{ width: "2vw", height: "2vw" }} onClick={() => fetchNodeData('WM-WF-KH98-40')} /> */}
                <InteractiveIcon src={WaterQuantityNode} alt="WaterQuantityNode" onClick={fetchNodeData} fetchNodeDataParam='WM-WF-KH98-40'/>
              </div>

              <div style={{ position: "absolute", top: "7.7vw", left: "29vw", textAlign: "center",transform: "rotate(90deg)", zIndex: 2 }}>
                {/* <img src={WaterQuantityNode} alt="WaterQuantityNode" style={{ width: "2vw", height: "2vw" }} onClick={()=> fetchNodeData('WM-WF-KH95-40')} /> */}
                <InteractiveIcon src={WaterQuantityNode} alt="WaterQuantityNode" onClick={fetchNodeData} fetchNodeDataParam='WM-WF-KH95-40'/>
              </div>

              <div style={{ position: "absolute", top: "7.2vw", left: "42vw", textAlign: "center", transform: "rotate(90deg)", zIndex: "2" }}>
                {/* <img src={WaterQuantityNode} alt="WaterQuantityNode" style={{ width: "2vw", height: "2vw" }} onClick={()=> fetchNodeData('WM-WF-KB04-70')} /> */}
                <InteractiveIcon src={WaterQuantityNode} alt="WaterQuantityNode" onClick={fetchNodeData} fetchNodeDataParam='WM-WF-KB04-70'/>
              </div>

              <div style={{ position: "absolute", top: "7.2vw", left: "48vw", textAlign: "center", transform: "rotate(90deg)", zIndex: "2"  }}>
                {/* <img src={WaterQuantityNode} alt="WaterQuantityNode" style={{ width: "2vw", height: "2vw" }} onClick={()=> fetchNodeData('WM-WF-KB04-73')} /> */}
                <InteractiveIcon src={WaterQuantityNode} alt="WaterQuantityNode" onClick={fetchNodeData} fetchNodeDataParam='WM-WF-KB04-73'/>
              </div>

              <div style={{ position: "absolute", top: "11vw", left: "54vw", textAlign: "center", transform: "rotate(90deg)" }}>
                {/* <img src={WaterQuantityNode} alt="WaterQuantityNode" style={{ width: "1.5vw", height: "1.5vw" }} onClick={()=> fetchNodeData('WM-WF-KB04-71')} /> */}
                <InteractiveIcon src={WaterQuantityNode} alt="WaterQuantityNode" onClick={fetchNodeData} fetchNodeDataParam='WM-WF-KB04-71'/>
              </div>

              <div style={{ position: "absolute", top: "11vw", left: "60vw", textAlign: "center", transform: "rotate(90deg)" }}>
                {/* <img src={WaterQuantityNode} alt="WaterQuantityNode" style={{ width: "1.5vw", height: "1.5vw" }} onClick={()=> fetchNodeData('WM-WF-KB04-72')} /> */}
                <InteractiveIcon src={WaterQuantityNode} alt="WaterQuantityNode" onClick={fetchNodeData} fetchNodeDataParam='WM-WF-KB04-72'/>
              </div>

            </div>

          </div>
        </div>
      </div>
      <div style={{ display: 'flex',flex:1, flexDirection: 'column', height: '45vw' }}>
      <Box src="https://smartcitylivinglab.iiit.ac.in/grafana/d/c9998c83-4255-4c0d-ad26-524b8b84272d/zf-digital-twin?orgId=1&kiosk&autofitpanels&theme=light&viewPanel=33" />
      <Box src="https://smartcitylivinglab.iiit.ac.in/grafana/d/c9998c83-4255-4c0d-ad26-524b8b84272d/zf-digital-twin?orgId=1&kiosk&autofitpanels&theme=light&viewPanel=10" />
      <Box src="https://smartcitylivinglab.iiit.ac.in/grafana/d/c9998c83-4255-4c0d-ad26-524b8b84272d/zf-digital-twin?orgId=1&kiosk&autofitpanels&theme=light&viewPanel=22" />
      <Box src="https://smartcitylivinglab.iiit.ac.in/grafana/d/c9998c83-4255-4c0d-ad26-524b8b84272d/zf-digital-twin?orgId=1&kiosk&autofitpanels&theme=light&viewPanel=21" />
    </div>
      </div>
    </div>
  );
};

export default RealValueVisualisation;
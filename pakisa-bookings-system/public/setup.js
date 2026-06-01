async function addDriver() {
  await fetch("/api/add-driver", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: document.getElementById("name").value,
      surname: document.getElementById("surname").value,
      idNumber: document.getElementById("idNumber").value
    })
  });

  alert("Driver added");
}

async function addVehicle() {
  await fetch("/api/add-vehicle", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      registration: document.getElementById("vehicle").value
    })
  });

  alert("Vehicle added");
}

async function initSystem() {
  await fetch("/api/setup", { method: "POST" });
  alert("System initialized");
}

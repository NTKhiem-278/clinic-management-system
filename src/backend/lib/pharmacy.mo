import Map "mo:core/Map";
import Time "mo:core/Time";
import Common "types/common";
import PrescriptionTypes "types/prescriptions";
import MedicineTypes "types/medicines";

// Domain logic for the pharmacy area: prescriptions, prescription details and
// medicines. Pure functions over the actor's stable collections; the API mixins
// own authorization and pass the shared state in.
module {
  // A medicine is considered low in stock at or below this threshold.
  let lowStockThreshold : Nat = 10;

  // ---------------------------------------------------------------------------
  // Medicines
  // ---------------------------------------------------------------------------

  public func listMedicines(medicines : Map.Map<Common.Id, MedicineTypes.Medicine>) : [MedicineTypes.Medicine] {
    medicines.values().toArray();
  };

  public func getMedicine(medicines : Map.Map<Common.Id, MedicineTypes.Medicine>, id : Common.Id) : ?MedicineTypes.Medicine {
    medicines.get(id);
  };

  public func createMedicine(
    medicines : Map.Map<Common.Id, MedicineTypes.Medicine>,
    state : { var nextMedicineId : Nat },
    input : MedicineTypes.MedicineInput,
  ) : MedicineTypes.Result<MedicineTypes.Medicine, MedicineTypes.MedicineError> {
    if (input.name == "") {
      return #err(#invalidInput("Tên thuốc không được để trống"));
    };
    if (input.unit == "") {
      return #err(#invalidInput("Đơn vị thuốc không được để trống"));
    };
    let id = state.nextMedicineId;
    state.nextMedicineId := id + 1;
    let medicine : MedicineTypes.Medicine = {
      id;
      name = input.name;
      unit = input.unit;
      unitPrice = input.unitPrice;
      stockQuantity = input.stockQuantity;
      expiryDate = input.expiryDate;
      createdAt = Time.now();
    };
    medicines.add(id, medicine);
    #ok(medicine);
  };

  public func updateMedicine(
    medicines : Map.Map<Common.Id, MedicineTypes.Medicine>,
    id : Common.Id,
    input : MedicineTypes.MedicineInput,
  ) : MedicineTypes.Result<MedicineTypes.Medicine, MedicineTypes.MedicineError> {
    switch (medicines.get(id)) {
      case (null) { #err(#notFound(id)) };
      case (?existing) {
        if (input.name == "") {
          return #err(#invalidInput("Tên thuốc không được để trống"));
        };
        if (input.unit == "") {
          return #err(#invalidInput("Đơn vị thuốc không được để trống"));
        };
        let updated : MedicineTypes.Medicine = {
          id = existing.id;
          name = input.name;
          unit = input.unit;
          unitPrice = input.unitPrice;
          stockQuantity = input.stockQuantity;
          expiryDate = input.expiryDate;
          createdAt = existing.createdAt;
        };
        medicines.add(id, updated);
        #ok(updated);
      };
    };
  };

  public func checkStock(medicines : Map.Map<Common.Id, MedicineTypes.Medicine>, id : Common.Id) : ?Nat {
    switch (medicines.get(id)) {
      case (null) { null };
      case (?medicine) { ?medicine.stockQuantity };
    };
  };

  public func checkExpiry(medicines : Map.Map<Common.Id, MedicineTypes.Medicine>, id : Common.Id) : ?Text {
    switch (medicines.get(id)) {
      case (null) { null };
      case (?medicine) { ?medicine.expiryDate };
    };
  };

  // True when the medicine exists and its stock is at or below the low-stock threshold.
  public func isLowStock(medicines : Map.Map<Common.Id, MedicineTypes.Medicine>, id : Common.Id) : Bool {
    switch (medicines.get(id)) {
      case (null) { false };
      case (?medicine) { medicine.stockQuantity <= lowStockThreshold };
    };
  };

  // True when the medicine exists and its expiry date is before the given ISO date (YYYY-MM-DD).
  public func isExpired(medicines : Map.Map<Common.Id, MedicineTypes.Medicine>, id : Common.Id, today : Text) : Bool {
    switch (medicines.get(id)) {
      case (null) { false };
      case (?medicine) { medicine.expiryDate < today };
    };
  };

  // Ids of medicines that are low in stock or already expired.
  public func flagLowOrExpired(
    medicines : Map.Map<Common.Id, MedicineTypes.Medicine>,
    today : Text,
  ) : [Common.Id] {
    medicines.values().filter(func(medicine) {
      medicine.stockQuantity <= lowStockThreshold or medicine.expiryDate < today
    }).map(func(medicine) { medicine.id }).toArray();
  };

  // ---------------------------------------------------------------------------
  // Prescriptions
  // ---------------------------------------------------------------------------

  public func listPrescriptions(
    prescriptions : Map.Map<Common.Id, PrescriptionTypes.Prescription>,
  ) : [PrescriptionTypes.Prescription] {
    prescriptions.values().toArray();
  };

  public func getPrescription(
    prescriptions : Map.Map<Common.Id, PrescriptionTypes.Prescription>,
    details : Map.Map<Common.Id, PrescriptionTypes.PrescriptionDetail>,
    id : Common.Id,
  ) : ?PrescriptionTypes.PrescriptionView {
    switch (prescriptions.get(id)) {
      case (null) { null };
      case (?prescription) {
        ?{
          id = prescription.id;
          medicalRecordId = prescription.medicalRecordId;
          patientId = prescription.patientId;
          doctorId = prescription.doctorId;
          notes = prescription.notes;
          createdAt = prescription.createdAt;
          details = detailsFor(details, prescription.id);
        };
      };
    };
  };

  public func createPrescription(
    prescriptions : Map.Map<Common.Id, PrescriptionTypes.Prescription>,
    state : { var nextPrescriptionId : Nat },
    medicalRecordId : Common.Id,
    patientId : Common.Id,
    doctorId : Common.Id,
    notes : Text,
  ) : PrescriptionTypes.Result<PrescriptionTypes.Prescription, PrescriptionTypes.PrescriptionError> {
    let id = state.nextPrescriptionId;
    state.nextPrescriptionId := id + 1;
    let prescription : PrescriptionTypes.Prescription = {
      id;
      medicalRecordId;
      patientId;
      doctorId;
      notes;
      createdAt = Time.now();
    };
    prescriptions.add(id, prescription);
    #ok(prescription);
  };

  public func addDetail(
    prescriptions : Map.Map<Common.Id, PrescriptionTypes.Prescription>,
    details : Map.Map<Common.Id, PrescriptionTypes.PrescriptionDetail>,
    state : { var nextDetailId : Nat },
    prescriptionId : Common.Id,
    medicineId : Common.Id,
    dosage : Text,
    quantity : Nat,
  ) : PrescriptionTypes.Result<PrescriptionTypes.PrescriptionDetail, PrescriptionTypes.PrescriptionError> {
    if (prescriptions.get(prescriptionId) == null) {
      return #err(#notFound(prescriptionId));
    };
    if (dosage == "") {
      return #err(#invalidInput("Liều dùng không được để trống"));
    };
    let id = state.nextDetailId;
    state.nextDetailId := id + 1;
    let detail : PrescriptionTypes.PrescriptionDetail = {
      id;
      prescriptionId;
      medicineId;
      dosage;
      quantity;
    };
    details.add(id, detail);
    #ok(detail);
  };

  public func removeDetail(
    details : Map.Map<Common.Id, PrescriptionTypes.PrescriptionDetail>,
    detailId : Common.Id,
  ) : PrescriptionTypes.Result<(), PrescriptionTypes.PrescriptionError> {
    switch (details.get(detailId)) {
      case (null) { #err(#notFound(detailId)) };
      case (?_) {
        details.remove(detailId);
        #ok(());
      };
    };
  };

  public func updateDosage(
    details : Map.Map<Common.Id, PrescriptionTypes.PrescriptionDetail>,
    detailId : Common.Id,
    dosage : Text,
    quantity : Nat,
  ) : PrescriptionTypes.Result<PrescriptionTypes.PrescriptionDetail, PrescriptionTypes.PrescriptionError> {
    switch (details.get(detailId)) {
      case (null) { #err(#notFound(detailId)) };
      case (?existing) {
        if (dosage == "") {
          return #err(#invalidInput("Liều dùng không được để trống"));
        };
        let updated : PrescriptionTypes.PrescriptionDetail = {
          id = existing.id;
          prescriptionId = existing.prescriptionId;
          medicineId = existing.medicineId;
          dosage;
          quantity;
        };
        details.add(detailId, updated);
        #ok(updated);
      };
    };
  };

  // Total number of distinct medicine lines in a prescription.
  public func calculateTotalItems(
    details : Map.Map<Common.Id, PrescriptionTypes.PrescriptionDetail>,
    prescriptionId : Common.Id,
  ) : Nat {
    detailsFor(details, prescriptionId).size();
  };

  // Total quantity of medicine units across every line of a prescription.
  public func calculateTotalQuantity(
    details : Map.Map<Common.Id, PrescriptionTypes.PrescriptionDetail>,
    prescriptionId : Common.Id,
  ) : Nat {
    detailsFor(details, prescriptionId).foldLeft(0, func(acc, detail) { acc + detail.quantity });
  };

  // All detail lines belonging to a prescription, in insertion order.
  func detailsFor(
    details : Map.Map<Common.Id, PrescriptionTypes.PrescriptionDetail>,
    prescriptionId : Common.Id,
  ) : [PrescriptionTypes.PrescriptionDetail] {
    details.values().filter(func(detail) { detail.prescriptionId == prescriptionId }).toArray();
  };
};

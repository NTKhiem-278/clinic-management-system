import Map "mo:core/Map";
import Time "mo:core/Time";
import Types "../types/prescriptions";
import Common "../types/common";

module {
  public func listPrescriptions(
    prescriptions : Map.Map<Common.Id, Types.Prescription>,
  ) : [Types.Prescription] {
    prescriptions.values().toArray();
  };

  public func getPrescription(
    prescriptions : Map.Map<Common.Id, Types.Prescription>,
    details : Map.Map<Common.Id, Types.PrescriptionDetail>,
    id : Common.Id,
  ) : ?Types.PrescriptionView {
    switch (prescriptions.get(id)) {
      case null { null };
      case (?prescription) {
        let prescriptionDetails = details.values().filter(
          func detail = detail.prescriptionId == id
        ).toArray();
        ?{
          id = prescription.id;
          medicalRecordId = prescription.medicalRecordId;
          patientId = prescription.patientId;
          doctorId = prescription.doctorId;
          notes = prescription.notes;
          createdAt = prescription.createdAt;
          details = prescriptionDetails;
        };
      };
    };
  };

  public func createPrescription(
    prescriptions : Map.Map<Common.Id, Types.Prescription>,
    state : { var nextPrescriptionId : Nat },
    medicalRecordId : Common.Id,
    patientId : Common.Id,
    doctorId : Common.Id,
    notes : Text,
  ) : Types.Result<Types.Prescription, Types.PrescriptionError> {
    let id = state.nextPrescriptionId;
    state.nextPrescriptionId := id + 1;
    let prescription : Types.Prescription = {
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
    prescriptions : Map.Map<Common.Id, Types.Prescription>,
    details : Map.Map<Common.Id, Types.PrescriptionDetail>,
    state : { var nextDetailId : Nat },
    prescriptionId : Common.Id,
    medicineId : Common.Id,
    dosage : Text,
    quantity : Nat,
  ) : Types.Result<Types.PrescriptionDetail, Types.PrescriptionError> {
    if (prescriptions.get(prescriptionId) == null) {
      return #err(#notFound(prescriptionId));
    };
    if (quantity == 0) {
      return #err(#invalidInput("Số lượng thuốc phải lớn hơn 0"));
    };
    let id = state.nextDetailId;
    state.nextDetailId := id + 1;
    let detail : Types.PrescriptionDetail = {
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
    details : Map.Map<Common.Id, Types.PrescriptionDetail>,
    detailId : Common.Id,
  ) : Types.Result<(), Types.PrescriptionError> {
    switch (details.get(detailId)) {
      case null { #err(#notFound(detailId)) };
      case (?_) {
        details.remove(detailId);
        #ok(());
      };
    };
  };

  public func updateDosage(
    details : Map.Map<Common.Id, Types.PrescriptionDetail>,
    detailId : Common.Id,
    dosage : Text,
    quantity : Nat,
  ) : Types.Result<Types.PrescriptionDetail, Types.PrescriptionError> {
    switch (details.get(detailId)) {
      case null { #err(#notFound(detailId)) };
      case (?existing) {
        if (quantity == 0) {
          return #err(#invalidInput("Số lượng thuốc phải lớn hơn 0"));
        };
        let updated : Types.PrescriptionDetail = {
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

  public func calculateTotalItems(
    details : Map.Map<Common.Id, Types.PrescriptionDetail>,
    prescriptionId : Common.Id,
  ) : Nat {
    details.values().filter(
      func detail = detail.prescriptionId == prescriptionId
    ).size();
  };
};

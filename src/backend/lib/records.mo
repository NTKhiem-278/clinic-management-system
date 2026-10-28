import Map "mo:core/Map";
import Time "mo:core/Time";
import Types "../types/records";
import Common "../types/common";

module {
  public func listRecords(records : Map.Map<Common.Id, Types.MedicalRecord>) : [Types.MedicalRecord] {
    records.values().toArray();
  };

  public func listRecordsByPatient(
    records : Map.Map<Common.Id, Types.MedicalRecord>,
    patientId : Common.Id,
  ) : [Types.MedicalRecord] {
    records.values().filter(func record = record.patientId == patientId).toArray();
  };

  public func getRecord(
    records : Map.Map<Common.Id, Types.MedicalRecord>,
    id : Common.Id,
  ) : ?Types.MedicalRecord {
    records.get(id);
  };

  public func createRecord(
    records : Map.Map<Common.Id, Types.MedicalRecord>,
    state : { var nextRecordId : Nat },
    patientId : Common.Id,
    doctorId : Common.Id,
    input : Types.MedicalRecordInput,
  ) : Types.Result<Types.MedicalRecord, Types.MedicalRecordError> {
    if (input.symptoms.size() == 0 and input.diagnosis.size() == 0) {
      return #err(#invalidInput("Cần có triệu chứng hoặc chẩn đoán"));
    };
    let id = state.nextRecordId;
    state.nextRecordId := id + 1;
    let now = Time.now();
    let record : Types.MedicalRecord = {
      id;
      appointmentId = input.appointmentId;
      patientId;
      doctorId;
      symptoms = input.symptoms;
      diagnosis = input.diagnosis;
      examinationResult = input.examinationResult;
      testResults = input.testResults;
      createdAt = now;
      updatedAt = now;
    };
    records.add(id, record);
    #ok(record);
  };

  public func updateRecord(
    records : Map.Map<Common.Id, Types.MedicalRecord>,
    id : Common.Id,
    input : Types.MedicalRecordInput,
  ) : Types.Result<Types.MedicalRecord, Types.MedicalRecordError> {
    switch (records.get(id)) {
      case (null) { #err(#notFound(id)) };
      case (?existing) {
        let updated : Types.MedicalRecord = {
          id = existing.id;
          appointmentId = input.appointmentId;
          patientId = existing.patientId;
          doctorId = existing.doctorId;
          symptoms = input.symptoms;
          diagnosis = input.diagnosis;
          examinationResult = input.examinationResult;
          testResults = input.testResults;
          createdAt = existing.createdAt;
          updatedAt = Time.now();
        };
        records.add(id, updated);
        #ok(updated);
      };
    };
  };

  public func updateExaminationResult(
    records : Map.Map<Common.Id, Types.MedicalRecord>,
    id : Common.Id,
    examinationResult : Text,
  ) : Types.Result<Types.MedicalRecord, Types.MedicalRecordError> {
    switch (records.get(id)) {
      case (null) { #err(#notFound(id)) };
      case (?existing) {
        let updated : Types.MedicalRecord = {
          id = existing.id;
          appointmentId = existing.appointmentId;
          patientId = existing.patientId;
          doctorId = existing.doctorId;
          symptoms = existing.symptoms;
          diagnosis = existing.diagnosis;
          examinationResult;
          testResults = existing.testResults;
          createdAt = existing.createdAt;
          updatedAt = Time.now();
        };
        records.add(id, updated);
        #ok(updated);
      };
    };
  };

  public func addTestResult(
    records : Map.Map<Common.Id, Types.MedicalRecord>,
    id : Common.Id,
    testResult : Text,
  ) : Types.Result<Types.MedicalRecord, Types.MedicalRecordError> {
    switch (records.get(id)) {
      case (null) { #err(#notFound(id)) };
      case (?existing) {
        let combined = if (existing.testResults.size() == 0) {
          testResult;
        } else {
          existing.testResults # "\n" # testResult;
        };
        let updated : Types.MedicalRecord = {
          id = existing.id;
          appointmentId = existing.appointmentId;
          patientId = existing.patientId;
          doctorId = existing.doctorId;
          symptoms = existing.symptoms;
          diagnosis = existing.diagnosis;
          examinationResult = existing.examinationResult;
          testResults = combined;
          createdAt = existing.createdAt;
          updatedAt = Time.now();
        };
        records.add(id, updated);
        #ok(updated);
      };
    };
  };

  public func getPatientHistory(
    records : Map.Map<Common.Id, Types.MedicalRecord>,
    patientId : Common.Id,
  ) : [Types.MedicalRecord] {
    listRecordsByPatient(records, patientId);
  };
};

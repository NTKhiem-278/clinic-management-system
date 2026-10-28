import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Types "../types/patients";
import Common "../types/common";

module {
  public func listPatients(patients : Map.Map<Common.Id, Types.Patient>) : [Types.Patient] {
    patients.values().toArray();
  };

  public func searchPatients(
    patients : Map.Map<Common.Id, Types.Patient>,
    term : Text,
  ) : [Types.Patient] {
    let needle = term.toLower();
    if (needle == "") {
      return patients.values().toArray();
    };
    patients.values().filter(
      func(p) {
        p.fullName.toLower().contains(#text needle)
        or p.id.toText().contains(#text needle);
      }
    ).toArray();
  };

  public func getPatient(
    patients : Map.Map<Common.Id, Types.Patient>,
    id : Common.Id,
  ) : ?Types.Patient {
    patients.get(id);
  };

  public func createPatient(
    patients : Map.Map<Common.Id, Types.Patient>,
    state : { var nextPatientId : Nat },
    input : Types.PatientInput,
  ) : Types.Result<Types.Patient, Types.PatientError> {
    if (input.fullName == "") {
      return #err(#invalidInput("Họ tên không được để trống"));
    };
    let id = state.nextPatientId;
    state.nextPatientId := id + 1;
    let patient : Types.Patient = {
      id;
      fullName = input.fullName;
      dateOfBirth = input.dateOfBirth;
      gender = input.gender;
      phone = input.phone;
      address = input.address;
      notes = input.notes;
      createdAt = Time.now();
    };
    patients.add(id, patient);
    #ok(patient);
  };

  public func updatePatient(
    patients : Map.Map<Common.Id, Types.Patient>,
    id : Common.Id,
    input : Types.PatientInput,
  ) : Types.Result<Types.Patient, Types.PatientError> {
    switch (patients.get(id)) {
      case null { #err(#notFound(id)) };
      case (?existing) {
        if (input.fullName == "") {
          return #err(#invalidInput("Họ tên không được để trống"));
        };
        let updated : Types.Patient = {
          id = existing.id;
          fullName = input.fullName;
          dateOfBirth = input.dateOfBirth;
          gender = input.gender;
          phone = input.phone;
          address = input.address;
          notes = input.notes;
          createdAt = existing.createdAt;
        };
        patients.add(id, updated);
        #ok(updated);
      };
    };
  };
};

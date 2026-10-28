import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Types "../types/doctors";
import Common "../types/common";

module {
  public func listDoctors(doctors : Map.Map<Common.Id, Types.Doctor>) : [Types.Doctor] {
    doctors.values().toArray();
  };

  public func searchDoctors(
    doctors : Map.Map<Common.Id, Types.Doctor>,
    term : Text,
  ) : [Types.Doctor] {
    let needle = term.toLower();
    if (needle == "") {
      return doctors.values().toArray();
    };
    doctors.values().filter(
      func(d) {
        d.fullName.toLower().contains(#text needle)
        or d.specialty.toLower().contains(#text needle);
      }
    ).toArray();
  };

  public func getDoctor(
    doctors : Map.Map<Common.Id, Types.Doctor>,
    id : Common.Id,
  ) : ?Types.Doctor {
    doctors.get(id);
  };

  public func createDoctor(
    doctors : Map.Map<Common.Id, Types.Doctor>,
    state : { var nextDoctorId : Nat },
    input : Types.DoctorInput,
  ) : Types.Result<Types.Doctor, Types.DoctorError> {
    if (input.fullName == "") {
      return #err(#invalidInput("Họ tên không được để trống"));
    };
    let id = state.nextDoctorId;
    state.nextDoctorId := id + 1;
    let doctor : Types.Doctor = {
      id;
      fullName = input.fullName;
      specialty = input.specialty;
      phone = input.phone;
      email = input.email;
      createdAt = Time.now();
    };
    doctors.add(id, doctor);
    #ok(doctor);
  };

  public func updateDoctor(
    doctors : Map.Map<Common.Id, Types.Doctor>,
    id : Common.Id,
    input : Types.DoctorInput,
  ) : Types.Result<Types.Doctor, Types.DoctorError> {
    switch (doctors.get(id)) {
      case null { #err(#notFound(id)) };
      case (?existing) {
        if (input.fullName == "") {
          return #err(#invalidInput("Họ tên không được để trống"));
        };
        let updated : Types.Doctor = {
          id = existing.id;
          fullName = input.fullName;
          specialty = input.specialty;
          phone = input.phone;
          email = input.email;
          createdAt = existing.createdAt;
        };
        doctors.add(id, updated);
        #ok(updated);
      };
    };
  };
};

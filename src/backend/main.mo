import Map "mo:core/Map";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import Expose "mo:caffeineai-oql/Expose";
import Entity "mo:caffeineai-oql/Entity";
import MapEntity "mo:caffeineai-oql/MapEntity";
import RecordValue "mo:caffeineai-oql/RecordValue";
import NatValue "mo:caffeineai-oql/NatValue";
import TextValue "mo:caffeineai-oql/TextValue";
import PrincipalValue "mo:caffeineai-oql/PrincipalValue";
import IntValue "mo:caffeineai-oql/IntValue";
import BoolValue "mo:caffeineai-oql/BoolValue";
import GenderValue "types/GenderValue";
import AppointmentStatusValue "types/AppointmentStatusValue";
import RoleNameValue "types/RoleNameValue";

import Common "types/common";
import PatientTypes "types/patients";
import DoctorTypes "types/doctors";
import AppointmentTypes "types/appointments";
import RecordTypes "types/records";
import PrescriptionTypes "types/prescriptions";
import MedicineTypes "types/medicines";
import AccountTypes "types/accounts";

import PatientsApi "mixins/patients-api";
import DoctorsApi "mixins/doctors-api";
import AppointmentsApi "mixins/appointments-api";
import RecordsApi "mixins/records-api";
import PrescriptionsApi "mixins/prescriptions-api";
import MedicinesApi "mixins/medicines-api";
import AccountsApi "mixins/accounts-api";
import ApiDocMixin "mixins/api-doc";

actor {
  let accessControlState : AccessControl.AccessControlState;
  include MixinAuthorization(accessControlState, null);

  let patients : Map.Map<Common.Id, PatientTypes.Patient>;
  let doctors : Map.Map<Common.Id, DoctorTypes.Doctor>;
  let appointments : Map.Map<Common.Id, AppointmentTypes.Appointment>;
  let records : Map.Map<Common.Id, RecordTypes.MedicalRecord>;
  let prescriptions : Map.Map<Common.Id, PrescriptionTypes.Prescription>;
  let prescriptionDetails : Map.Map<Common.Id, PrescriptionTypes.PrescriptionDetail>;
  let medicines : Map.Map<Common.Id, MedicineTypes.Medicine>;
  let accounts : Map.Map<Principal, AccountTypes.UserAccount>;
  let roles : Map.Map<Common.Id, AccountTypes.Role>;

  let counters : {
    var nextPatientId : Nat;
    var nextDoctorId : Nat;
    var nextAppointmentId : Nat;
    var nextRecordId : Nat;
    var nextPrescriptionId : Nat;
    var nextDetailId : Nat;
    var nextMedicineId : Nat;
    var nextRoleId : Nat;
  };

  include PatientsApi(accessControlState, patients, counters);
  include DoctorsApi(accessControlState, doctors, counters);
  include AppointmentsApi(accessControlState, appointments, counters);
  include RecordsApi(accessControlState, records, accounts, counters);
  include PrescriptionsApi(accessControlState, prescriptions, prescriptionDetails, counters);
  include MedicinesApi(accessControlState, medicines, counters);
  include AccountsApi(accessControlState, accounts, roles, counters);

  include ApiDocMixin();

  include Expose({
    entities = [
      patients.toEntity("patient", "Patient", "id")
        .sample({
          id = 0;
          fullName = "";
          dateOfBirth = "";
          gender = #other;
          phone = "";
          address = "";
          notes = "";
          createdAt = 0;
        })
        .controllerOnly()
        .build(),
      doctors.toEntity("doctor", "Doctor", "id")
        .sample({
          id = 0;
          fullName = "";
          specialty = "";
          phone = "";
          email = "";
          createdAt = 0;
        })
        .controllerOnly()
        .build(),
      appointments.toEntity("appointment", "Appointment", "id")
        .sample({
          id = 0;
          patientId = 0;
          doctorId = 0;
          scheduledAt = 0;
          reason = "";
          status = #pending;
          createdAt = 0;
        })
        .controllerOnly()
        .build(),
      records.toEntity("medicalRecord", "MedicalRecord", "id")
        .sample({
          id = 0;
          appointmentId = 0;
          patientId = 0;
          doctorId = 0;
          symptoms = "";
          diagnosis = "";
          examinationResult = "";
          testResults = "";
          createdAt = 0;
          updatedAt = 0;
        })
        .controllerOnly()
        .build(),
      prescriptions.toEntity("prescription", "Prescription", "id")
        .sample({
          id = 0;
          medicalRecordId = 0;
          patientId = 0;
          doctorId = 0;
          notes = "";
          createdAt = 0;
        })
        .controllerOnly()
        .build(),
      prescriptionDetails.toEntity("prescriptionDetail", "PrescriptionDetail", "id")
        .sample({
          id = 0;
          prescriptionId = 0;
          medicineId = 0;
          dosage = "";
          quantity = 0;
        })
        .controllerOnly()
        .build(),
      medicines.toEntity("medicine", "Medicine", "id")
        .sample({
          id = 0;
          name = "";
          unit = "";
          unitPrice = 0;
          stockQuantity = 0;
          expiryDate = "";
          createdAt = 0;
        })
        .controllerOnly()
        .build(),
      accounts.toEntity("userAccount", "UserAccount", "principal")
        .sample({
          principal = Principal.fromText("aaaaa-aa");
          displayName = "";
          role = #patient;
          active = true;
          createdAt = 0;
        })
        .controllerOnly()
        .build(),
      roles.toEntityManual("role", "Role", "id")
        .sample({
          id = 0;
          name = #patient;
          permissions = [];
        })
        .payload("name", func role = role.name)
        .payload("permissionCount", func role = role.permissions.size())
        .controllerOnly()
        .build(),
    ];
  });
};

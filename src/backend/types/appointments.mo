import Debug "mo:core/Debug";
import Common "common";

module {
  public type AppointmentStatus = {
    #pending;
    #confirmed;
    #completed;
    #cancelled;
  };

  public type Appointment = {
    id : Common.Id;
    patientId : Common.Id;
    doctorId : Common.Id;
    scheduledAt : Common.Timestamp;
    reason : Text;
    status : AppointmentStatus;
    createdAt : Common.Timestamp;
  };

  public type AppointmentInput = {
    patientId : Common.Id;
    doctorId : Common.Id;
    scheduledAt : Common.Timestamp;
    reason : Text;
  };

  public type AppointmentError = {
    #notFound : Common.Id;
    #unauthorized;
    #invalidInput : Text;
    #invalidStatusTransition : Text;
  };

  public type Result<Ok, Err> = Common.Result<Ok, Err>;
};

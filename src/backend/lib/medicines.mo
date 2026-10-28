import Map "mo:core/Map";
import Time "mo:core/Time";
import Types "../types/medicines";
import Common "../types/common";

module {
  public func listMedicines(medicines : Map.Map<Common.Id, Types.Medicine>) : [Types.Medicine] {
    medicines.values().toArray();
  };

  public func getMedicine(medicines : Map.Map<Common.Id, Types.Medicine>, id : Common.Id) : ?Types.Medicine {
    medicines.get(id);
  };

  public func createMedicine(
    medicines : Map.Map<Common.Id, Types.Medicine>,
    state : { var nextMedicineId : Nat },
    input : Types.MedicineInput,
  ) : Types.Result<Types.Medicine, Types.MedicineError> {
    if (input.name == "") {
      return #err(#invalidInput("Tên thuốc không được để trống"));
    };
    let id = state.nextMedicineId;
    state.nextMedicineId := id + 1;
    let medicine : Types.Medicine = {
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
    medicines : Map.Map<Common.Id, Types.Medicine>,
    id : Common.Id,
    input : Types.MedicineInput,
  ) : Types.Result<Types.Medicine, Types.MedicineError> {
    switch (medicines.get(id)) {
      case null { #err(#notFound(id)) };
      case (?existing) {
        if (input.name == "") {
          return #err(#invalidInput("Tên thuốc không được để trống"));
        };
        let updated : Types.Medicine = {
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

  public func checkStock(medicines : Map.Map<Common.Id, Types.Medicine>, id : Common.Id) : ?Nat {
    switch (medicines.get(id)) {
      case (?medicine) { ?medicine.stockQuantity };
      case null { null };
    };
  };

  public func checkExpiry(medicines : Map.Map<Common.Id, Types.Medicine>, id : Common.Id) : ?Text {
    switch (medicines.get(id)) {
      case (?medicine) { ?medicine.expiryDate };
      case null { null };
    };
  };
};

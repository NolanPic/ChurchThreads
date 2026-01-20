"use client";

import { forwardRef } from "react";
import { Id } from "@/convex/_generated/dataModel";
import MultiSelectComboBox, {
  MultiSelectOption,
  MultiSelectComboBoxProps,
} from "../ui/MultiSelectComboBox";
import UserAvatar from "./UserAvatar";
import styles from "./UserSelect.module.css";

export interface UserOption extends MultiSelectOption {
  _id: Id<"users">;
  name: string;
  image: string | null;
}

export interface UserSelectProps
  extends Omit<
    MultiSelectComboBoxProps<UserOption>,
    "options" | "renderOption" | "renderSelection"
  > {
  users: UserOption[];
}

export const UserSelect = forwardRef<HTMLInputElement, UserSelectProps>(
  ({ users, ...props }, ref) => {
    // Convert users to options format
    const options: UserOption[] = users.map((user) => ({
      text: user.name,
      value: user._id,
      _id: user._id,
      name: user.name,
      image: user.image,
    }));

    // Custom render for dropdown options
    const renderOption = (option: UserOption) => (
      <div className={styles.userOption}>
        <UserAvatar user={option} size={24} />
        <span className={styles.userName}>{option.name}</span>
      </div>
    );

    // Custom render for selected items
    const renderSelection = (option: UserOption) => (
      <div className={styles.userSelection}>
        <UserAvatar user={option} size={16} />
        <span className={styles.userName}>{option.name}</span>
      </div>
    );

    return (
      <MultiSelectComboBox<UserOption>
        ref={ref}
        options={options}
        renderOption={renderOption}
        renderSelection={renderSelection}
        {...props}
      />
    );
  }
);

UserSelect.displayName = "UserSelect";

export default UserSelect;

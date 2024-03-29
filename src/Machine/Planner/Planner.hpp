#pragma once

#include "Device/Axis.hpp"
#include "Machine/MessageBus/MachineRouter.hpp"
#include "State/Position.hpp"
#include "Device/IEncoder.hpp"
#include <cstdarg>
#include <etl/vector.h>
#include "Machine/FSM/Machine.hpp"

namespace Machine::Planner
{
/**
The main sync state and motion functionality*/

template <typename MainSpindleEncoder>
class Planner // public Machine::MessageBus::MachineRouter
{
    //static_assert((Device::IsEncoder<MainSpindleEncoder>::value), "The planner template type MainSpindleEncoder must derive from IEncoder"); 

    public:
        explicit Planner(MainSpindleEncoder& aMainSpindleEncoder, MessageBus::MachineRouter& aMachineRouter): 
            myMainSpindleEncoder(aMainSpindleEncoder), myRouter(aMachineRouter)
        {}
        virtual void Update() = 0;
        virtual void GenerateMoves() = 0;

    protected:
        MainSpindleEncoder& myMainSpindleEncoder;
        Machine::MessageBus::MachineRouter& myRouter;
};



} // namespace Machine::Planner